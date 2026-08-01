import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  CURRENCY,
  RESERVATION_MINUTES,
  SHIPPING_CENTS,
  checkoutRequestSchema,
} from '@/lib/commerce';
import {
  attachStripeSession,
  applySessionTransition,
  InventoryUnavailableError,
  ProductUnavailableError,
  reconcileExpiredReservationsForItems,
  releaseReservation,
  reserveOrder,
  synchronizeCheckoutOrder,
} from '@/lib/commerce-server';
import { getAdminDb } from '@/lib/firebase-admin';
import { createCheckoutManagementToken } from '@/lib/checkout-token';
import { getStripe } from '@/lib/stripe-server';
import { getCheckoutOrigin } from '@/lib/checkout-origin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let orderId = '';
  let stripeSessionCreated = false;
  let reservationReached = false;
  try {
    const parsed = checkoutRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'The checkout request is invalid.' },
        { status: 400 },
      );
    }

    orderId = parsed.data.checkoutAttemptId;
    const stripe = getStripe();
    let order: Awaited<ReturnType<typeof reserveOrder>>;
    try {
      order = await reserveOrder(orderId, parsed.data.items);
    } catch (error) {
      if (!(error instanceof InventoryUnavailableError)) throw error;
      // Only ask Stripe to repair expired holds after the atomic reservation
      // reports a shortage, then retry the exact reservation once.
      try {
        await reconcileExpiredReservationsForItems(stripe, parsed.data.items);
      } catch (reconciliationError) {
        console.error('Relevant reservation reconciliation failed:', reconciliationError);
        throw error;
      }
      order = await reserveOrder(orderId, parsed.data.items);
    }
    reservationReached = true;
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'This checkout was already paid.', attemptTerminal: true },
        { status: 409 },
      );
    }
    if (order.reservation_status !== 'reserved') {
      return NextResponse.json(
        {
          error: 'This checkout attempt expired. Please try again.',
          attemptTerminal: true,
        },
        { status: 409 },
      );
    }
    if (order.stripe_checkout_url) {
      const state = await synchronizeCheckoutOrder(stripe, orderId, 'status');
      if (state.paymentStatus === 'paid' || state.paymentStatus === 'refunded') {
        return NextResponse.json(
          { error: 'This checkout was already paid.', attemptTerminal: true },
          { status: 409 },
        );
      }
      if (state.reservationStatus !== 'reserved' || state.sessionStatus !== 'open') {
        return NextResponse.json(
          {
            error: 'This checkout attempt expired. Please refresh your cart.',
            attemptTerminal: true,
          },
          { status: 409 },
        );
      }
      return NextResponse.json({
        orderId,
        sessionId: state.sessionId,
        url: state.url,
        reservationExpiresAt: state.expiresAt,
        managementToken: createCheckoutManagementToken(orderId),
      });
    }

    const appUrl = getCheckoutOrigin(request);
    const managementToken = createCheckoutManagementToken(orderId);
    const session = await stripe.checkout.sessions.create({
      integration_identifier: 'tsi_web_qkrtmzpa',
      client_reference_id: orderId,
      metadata: { order_id: orderId },
      mode: 'payment',
      customer_creation: 'always',
      line_items: order.items.map(item => ({
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: `${item.title} (${item.variant})`,
            ...(item.image
              ? { images: [item.image.startsWith('http') ? item.image : `${appUrl}${item.image}`] }
              : {}),
          },
          unit_amount: item.unit_amount,
        },
        quantity: item.quantity,
      })),
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: SHIPPING_CENTS, currency: CURRENCY },
          display_name: 'Standard US shipping',
        },
      }],
      expires_at: Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        `${appUrl}/cart?cancel_attempt=${encodeURIComponent(orderId)}`
        + `&cancel_token=${encodeURIComponent(managementToken)}`,
    }, {
      idempotencyKey: `checkout-${orderId}`,
    });
    stripeSessionCreated = true;

    await attachStripeSession(orderId, session);
    return NextResponse.json({
      orderId,
      sessionId: session.id,
      url: session.url,
      reservationExpiresAt: new Date(session.expires_at * 1000).toISOString(),
      managementToken,
    });
  } catch (error) {
    // Once Stripe has created a Session, keep the reservation. A retry with the
    // same checkout attempt and idempotency key will recover the same Session.
    let attemptTerminal = !reservationReached;
    if (orderId && reservationReached && !stripeSessionCreated) {
      try {
        attemptTerminal = await releaseReservation(orderId, {
          source: 'checkout.create',
          reason: 'stripe_session_creation_failed',
        });
      } catch (releaseError) {
        console.error('Failed to release checkout reservation:', releaseError);
      }
    }
    const isAvailabilityConflict =
      error instanceof InventoryUnavailableError
      || error instanceof ProductUnavailableError;
    if (!isAvailabilityConflict) {
      console.error('Stripe Checkout API route error:', error);
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to start checkout.',
        attemptTerminal,
      },
      {
        status:
          isAvailabilityConflict ? 409 : 500,
      },
    );
  }
}

export async function GET(request: Request) {
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid Checkout Session.' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.client_reference_id || session.metadata?.order_id;
    if (!orderId || session.metadata?.order_id !== orderId) {
      return NextResponse.json({ error: 'Checkout Session not found.' }, { status: 404 });
    }
    const orderSnapshot = await getAdminDb().collection('orders').doc(orderId).get();
    if (
      !orderSnapshot.exists
      || orderSnapshot.data()?.stripe_checkout_session_id !== session.id
    ) {
      return NextResponse.json({ error: 'Checkout Session not found.' }, { status: 404 });
    }
    const transition = session.payment_status === 'paid'
      ? 'paid'
      : session.status === 'complete'
        ? 'processing'
        : session.status === 'expired'
          ? 'expired'
          : null;
    if (transition) {
      await applySessionTransition(
        `success_${session.id}_${transition}`,
        session,
        transition,
        'checkout.success',
      );
    }
    const synchronized = await getAdminDb().collection('orders').doc(orderId).get();
    const synchronizedOrder = synchronized.data();
    return NextResponse.json({
      id: orderId,
      paymentStatus: synchronizedOrder?.payment_status || session.payment_status,
      reservationStatus: synchronizedOrder?.reservation_status,
      inventoryException: Boolean(synchronizedOrder?.inventory_exception),
      status: session.status,
      customerName:
        session.collected_information?.shipping_details?.name
        || session.customer_details?.name,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    const statusCode = typeof error === 'object'
      && error !== null
      && 'statusCode' in error
      && typeof error.statusCode === 'number'
      ? error.statusCode
      : null;
    if (statusCode === 404) {
      return NextResponse.json({ error: 'Checkout Session not found.' }, { status: 404 });
    }
    console.error('Checkout verification failed:', error);
    return NextResponse.json(
      { error: 'Checkout verification is temporarily unavailable. Please retry.' },
      { status: 503 },
    );
  }
}
