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
  releaseReservation,
  reserveOrder,
} from '@/lib/commerce-server';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { maxNetworkRetries: 2 });
}

function getAppUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe test checkout is not configured on the server.' },
      { status: 503 },
    );
  }

  let orderId = '';
  let stripeSessionCreated = false;
  try {
    const parsed = checkoutRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'The checkout request is invalid.' },
        { status: 400 },
      );
    }

    orderId = parsed.data.checkoutAttemptId;
    const order = await reserveOrder(orderId, parsed.data.items);
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'This checkout was already paid.' }, { status: 409 });
    }
    if (order.reservation_status !== 'reserved') {
      return NextResponse.json(
        { error: 'This checkout attempt expired. Please try again.' },
        { status: 409 },
      );
    }
    if (order.stripe_checkout_url) {
      return NextResponse.json({
        orderId,
        sessionId: order.stripe_checkout_session_id,
        url: order.stripe_checkout_url,
      });
    }

    const appUrl = getAppUrl(request);
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
      cancel_url: `${appUrl}/cart`,
    }, {
      idempotencyKey: `checkout-${orderId}`,
    });
    stripeSessionCreated = true;

    await attachStripeSession(orderId, session);
    return NextResponse.json({
      orderId,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    // Once Stripe has created a Session, keep the reservation. A retry with the
    // same checkout attempt and idempotency key will recover the same Session.
    if (orderId && !stripeSessionCreated) {
      await releaseReservation(orderId).catch(releaseError => {
        console.error('Failed to release checkout reservation:', releaseError);
      });
    }
    console.error('Stripe Checkout API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to start checkout.' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
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
    return NextResponse.json({
      id: orderId,
      paymentStatus: session.payment_status,
      status: session.status,
      customerName:
        session.collected_information?.shipping_details?.name
        || session.customer_details?.name,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch {
    return NextResponse.json({ error: 'Checkout Session not found.' }, { status: 404 });
  }
}
