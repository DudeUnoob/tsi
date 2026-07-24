import { randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const emulatorEnabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const describeEmulator = emulatorEnabled ? describe : describe.skip;

describeEmulator('commerce Firestore transactions', () => {
  let db: ReturnType<typeof import('./firebase-admin')['getAdminDb']>;
  let reserveOrder: typeof import('./commerce-server')['reserveOrder'];
  let releaseReservation: typeof import('./commerce-server')['releaseReservation'];
  let applySessionTransition: typeof import('./commerce-server')['applySessionTransition'];
  let attachStripeSession: typeof import('./commerce-server')['attachStripeSession'];
  let synchronizeCheckoutOrder: typeof import('./commerce-server')['synchronizeCheckoutOrder'];
  let saveCommerceProduct: typeof import('./commerce-server')['saveCommerceProduct'];
  let markPaymentRefunded: typeof import('./commerce-server')['markPaymentRefunded'];
  const productId = 990001;
  const inventoryId = `${productId}_M`;

  beforeAll(async () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID ||= 'tsiwebsite-commerce-test';
    const admin = await import('./firebase-admin');
    db = admin.getAdminDb();
    ({
      reserveOrder,
      releaseReservation,
      applySessionTransition,
      attachStripeSession,
      synchronizeCheckoutOrder,
      saveCommerceProduct,
      markPaymentRefunded,
    } =
      await import('./commerce-server'));
  });

  beforeEach(async () => {
    const orders = await db.collection('orders').get();
    const events = await db.collection('stripe_events').get();
    const orderAudits = await db.collection('order_audit').get();
    const inventoryAudits = await db.collection('inventory_audit').get();
    const batch = db.batch();
    orders.docs.forEach(document => batch.delete(document.ref));
    events.docs.forEach(document => batch.delete(document.ref));
    orderAudits.docs.forEach(document => batch.delete(document.ref));
    inventoryAudits.docs.forEach(document => batch.delete(document.ref));
    batch.set(db.collection('store_products').doc(String(productId)), {
      id: productId,
      product_title: 'Emulator Tee',
      slug: 'emulator-tee',
      description: '',
      image: '',
      price_cents: 2500,
      currency: 'usd',
      variant_type: 'size',
      status: 'available',
      featured: false,
      published: true,
    });
    batch.set(db.collection('product_inventory').doc(inventoryId), {
      product_id: productId,
      variant: 'M',
      size: 'M',
      on_hand: 1,
      reserved: 0,
      sold: 0,
      stock: 1,
    });
    await batch.commit();
  });

  afterAll(async () => {
    if (!db) return;
    await Promise.all([
      db.collection('store_products').doc(String(productId)).delete(),
      db.collection('product_inventory').doc(inventoryId).delete(),
    ]);
  });

  it('allows only one simultaneous purchase of the final unit', async () => {
    const attempts = await Promise.allSettled([
      reserveOrder(randomUUID(), [{ productId, variant: 'M', quantity: 1 }]),
      reserveOrder(randomUUID(), [{ productId, variant: 'M', quantity: 1 }]),
    ]);
    expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter(result => result.status === 'rejected')).toHaveLength(1);
  });

  it('reuses a duplicate checkout attempt without reserving twice', async () => {
    const attemptId = randomUUID();
    const first = await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const second = await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    expect(second.id).toBe(first.id);
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()?.reserved).toBe(1);
    await expect(
      reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 2 }]),
    ).rejects.toThrow('different cart');
  });

  it('releases reservations idempotently', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    expect(await releaseReservation(attemptId)).toBe(true);
    expect(await releaseReservation(attemptId)).toBe(false);
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 0, sold: 0, stock: 1 });
  });

  it('treats duplicate expiration deliveries as no-ops after the first release', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const session = checkoutSession(attemptId);
    await attachStripeSession(attemptId, session);
    const expired = { ...session, status: 'expired' } as Stripe.Checkout.Session;

    await applySessionTransition('evt_expired_once', expired, 'expired');
    await applySessionTransition('evt_expired_replayed', expired, 'expired');

    const order = await db.collection('orders').doc(attemptId).get();
    expect(order.data()).toMatchObject({
      payment_status: 'failed',
      reservation_status: 'released',
    });
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 0, sold: 0 });
  });

  it('commits inventory once when webhook events are replayed', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const session = checkoutSession(attemptId, {
      status: 'complete',
      payment_status: 'paid',
      payment_intent: `pi_test_${attemptId}`,
    });
    await attachStripeSession(attemptId, session);

    await applySessionTransition('evt_paid_once', session, 'paid');
    await applySessionTransition('evt_paid_once', session, 'paid');
    await applySessionTransition('evt_paid_duplicate_delivery', session, 'paid');

    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 0, reserved: 0, sold: 1 });
  });

  it('releases an explicitly cancelled Session only after Stripe expires it', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const openSession = checkoutSession(attemptId, {
      status: 'open',
      payment_status: 'unpaid',
    });
    await attachStripeSession(attemptId, openSession);
    const expiredSession = checkoutSession(attemptId, {
      status: 'expired',
      payment_status: 'unpaid',
    });
    const stripe = stripeClient(openSession, expiredSession);

    const state = await synchronizeCheckoutOrder(stripe, attemptId, 'cancel');
    expect(stripe.checkout.sessions.expire).toHaveBeenCalledOnce();
    expect(state).toMatchObject({
      paymentStatus: 'failed',
      reservationStatus: 'released',
      sessionStatus: 'expired',
    });
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 0, sold: 0 });
  });

  it('handles repeated explicit cancellation without releasing twice', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const openSession = checkoutSession(attemptId, {
      status: 'open',
      payment_status: 'unpaid',
    });
    const expiredSession = checkoutSession(attemptId, {
      status: 'expired',
      payment_status: 'unpaid',
    });
    await attachStripeSession(attemptId, openSession);
    const retrieve = vi.fn()
      .mockResolvedValueOnce(openSession)
      .mockResolvedValue(expiredSession);
    const expire = vi.fn().mockResolvedValue(expiredSession);
    const stripe = {
      checkout: { sessions: { retrieve, expire } },
    } as unknown as Stripe;

    await synchronizeCheckoutOrder(stripe, attemptId, 'cancel');
    const repeated = await synchronizeCheckoutOrder(stripe, attemptId, 'cancel');
    expect(expire).toHaveBeenCalledOnce();
    expect(repeated.reservationStatus).toBe('released');
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 0, sold: 0 });
  });

  it('releases a naturally expired open Session after Stripe expires it', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const openSession = checkoutSession(attemptId, {
      status: 'open',
      payment_status: 'unpaid',
      expires_at: Math.floor(Date.now() / 1000) - 1,
    });
    const expiredSession = checkoutSession(attemptId, {
      status: 'expired',
      payment_status: 'unpaid',
      expires_at: openSession.expires_at,
    });
    await attachStripeSession(attemptId, openSession);
    const stripe = stripeClient(openSession, expiredSession);

    const state = await synchronizeCheckoutOrder(stripe, attemptId, 'reconcile');
    expect(stripe.checkout.sessions.expire).toHaveBeenCalledOnce();
    expect(state).toMatchObject({
      paymentStatus: 'failed',
      reservationStatus: 'released',
    });
  });

  it('releases an already expired Session during reconciliation', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const expiredSession = checkoutSession(attemptId, {
      status: 'expired',
      payment_status: 'unpaid',
      expires_at: Math.floor(Date.now() / 1000) - 1,
    });
    await attachStripeSession(attemptId, expiredSession);
    const stripe = stripeClient(expiredSession);

    const state = await synchronizeCheckoutOrder(stripe, attemptId, 'reconcile');
    expect(stripe.checkout.sessions.expire).not.toHaveBeenCalled();
    expect(state.reservationStatus).toBe('released');
  });

  it('keeps a completed asynchronous payment reserved and processing', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const processing = checkoutSession(attemptId, {
      status: 'complete',
      payment_status: 'unpaid',
    });
    await attachStripeSession(attemptId, processing);

    const state = await synchronizeCheckoutOrder(
      stripeClient(processing),
      attemptId,
      'reconcile',
    );
    expect(state).toMatchObject({
      paymentStatus: 'processing',
      reservationStatus: 'reserved',
      url: null,
    });
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 1, sold: 0 });
  });

  it('keeps paid inventory committed when an expired event arrives later', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const paid = checkoutSession(attemptId, {
      status: 'complete',
      payment_status: 'paid',
      payment_intent: `pi_${attemptId}`,
    });
    await attachStripeSession(attemptId, paid);
    await applySessionTransition('evt_paid_first', paid, 'paid', 'checkout.success');
    await applySessionTransition(
      'evt_expired_late',
      checkoutSession(attemptId, { status: 'expired', payment_status: 'unpaid' }),
      'expired',
      'stripe.webhook',
    );

    const order = await db.collection('orders').doc(attemptId).get();
    expect(order.data()).toMatchObject({
      payment_status: 'paid',
      reservation_status: 'committed',
      stripe_session_status: 'complete',
      stripe_payment_status: 'paid',
      stripe_payment_intent_id: `pi_${attemptId}`,
      last_transition_source: 'checkout.success',
    });
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 0, reserved: 0, sold: 1 });
  });

  it('finalizes a paid Session during reconciliation instead of releasing it', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const paid = checkoutSession(attemptId, {
      status: 'complete',
      payment_status: 'paid',
      payment_intent: `pi_${attemptId}`,
    });
    await attachStripeSession(attemptId, paid);
    const state = await synchronizeCheckoutOrder(stripeClient(paid), attemptId, 'reconcile');
    expect(state).toMatchObject({
      paymentStatus: 'paid',
      reservationStatus: 'committed',
    });
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 0, reserved: 0, sold: 1 });
  });

  it('retains inventory when Stripe reconciliation is unavailable', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const session = checkoutSession(attemptId, {
      status: 'open',
      payment_status: 'unpaid',
    });
    await attachStripeSession(attemptId, session);
    const stripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockRejectedValue(new Error('Stripe unavailable')),
          expire: vi.fn(),
        },
      },
    } as unknown as Stripe;

    await expect(
      synchronizeCheckoutOrder(stripe, attemptId, 'reconcile'),
    ).rejects.toThrow('Stripe unavailable');
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 1, sold: 0 });
  });

  it('reallocates a late paid order only from currently available inventory', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const session = checkoutSession(attemptId, {
      status: 'open',
      payment_status: 'unpaid',
    });
    await attachStripeSession(attemptId, session);
    await applySessionTransition(
      'evt_expired_before_paid',
      { ...session, status: 'expired' } as Stripe.Checkout.Session,
      'expired',
    );
    await applySessionTransition(
      'evt_late_paid',
      {
        ...session,
        status: 'complete',
        payment_status: 'paid',
        payment_intent: `pi_${attemptId}`,
      } as Stripe.Checkout.Session,
      'paid',
    );
    const order = await db.collection('orders').doc(attemptId).get();
    expect(order.data()).toMatchObject({
      payment_status: 'paid',
      reservation_status: 'committed',
      inventory_exception: false,
    });
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 0, reserved: 0, sold: 1 });
  });

  it('retains the order reservation when an inventory record is missing', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const session = checkoutSession(attemptId);
    await attachStripeSession(attemptId, session);
    await db.collection('product_inventory').doc(inventoryId).delete();

    await expect(applySessionTransition(
      'evt_expired_missing_inventory',
      { ...session, status: 'expired' } as Stripe.Checkout.Session,
      'expired',
    )).rejects.toThrow('reservation was retained');
    const order = await db.collection('orders').doc(attemptId).get();
    expect(order.data()).toMatchObject({
      payment_status: 'pending',
      reservation_status: 'reserved',
    });
  });

  it('rejects Stripe Sessions whose order references or attached Session do not match', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const attached = checkoutSession(attemptId);
    await attachStripeSession(attemptId, attached);

    await expect(applySessionTransition(
      'evt_mismatched_reference',
      checkoutSession(attemptId, {
        metadata: { order_id: randomUUID() },
      }),
      'paid',
    )).rejects.toThrow('order references do not match');
    await expect(applySessionTransition(
      'evt_mismatched_session',
      { ...attached, id: 'cs_test_different' } as Stripe.Checkout.Session,
      'paid',
    )).rejects.toThrow('does not belong');
  });

  it('flags a late paid order when the full order cannot be reallocated', async () => {
    const firstAttempt = randomUUID();
    await reserveOrder(firstAttempt, [{ productId, variant: 'M', quantity: 1 }]);
    const firstSession = checkoutSession(firstAttempt);
    await attachStripeSession(firstAttempt, firstSession);
    await applySessionTransition(
      'evt_shortage_expired',
      { ...firstSession, status: 'expired' } as Stripe.Checkout.Session,
      'expired',
    );
    await reserveOrder(randomUUID(), [{ productId, variant: 'M', quantity: 1 }]);

    await applySessionTransition(
      'evt_late_paid_shortage',
      {
        ...firstSession,
        status: 'complete',
        payment_status: 'paid',
        payment_intent: `pi_${firstAttempt}`,
      } as Stripe.Checkout.Session,
      'paid',
    );
    const order = await db.collection('orders').doc(firstAttempt).get();
    expect(order.data()).toMatchObject({
      payment_status: 'paid',
      reservation_status: 'released',
      inventory_exception: true,
    });
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 1, sold: 0 });
  });

  it('rejects an admin on-hand value below active reservations', async () => {
    await reserveOrder(randomUUID(), [{ productId, variant: 'M', quantity: 1 }]);
    await expect(saveCommerceProduct(
      { uid: 'admin', email: 'admin@example.com' },
      {
        id: productId,
        product_title: 'Emulator Tee',
        slug: 'emulator-tee',
        description: '',
        image: '',
        price_cents: 2500,
        currency: 'usd',
        variant_type: 'size',
        status: 'available',
        featured: false,
        published: true,
      },
      [{ variant: 'M', on_hand: 0 }],
    )).rejects.toThrow('cannot be set below');
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 1 });
  });

  it('rejects duplicate or product-incompatible admin inventory variants', async () => {
    const product = {
      id: productId,
      product_title: 'Emulator Tee',
      slug: 'emulator-tee',
      description: '',
      image: '',
      price_cents: 2500,
      currency: 'usd' as const,
      variant_type: 'size' as const,
      status: 'available' as const,
      featured: false,
      published: true,
    };
    await expect(saveCommerceProduct(
      { uid: 'admin', email: 'admin@example.com' },
      product,
      [{ variant: 'M', on_hand: 1 }, { variant: 'm', on_hand: 1 }],
    )).rejects.toThrow('must be unique');
    await expect(saveCommerceProduct(
      { uid: 'admin', email: 'admin@example.com' },
      product,
      [{ variant: 'OS', on_hand: 1 }],
    )).rejects.toThrow('not a valid variant');
  });

  it('keeps inventory unchanged when a paid order is refunded', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const paid = checkoutSession(attemptId, {
      status: 'complete',
      payment_status: 'paid',
      payment_intent: `pi_${attemptId}`,
    });
    await attachStripeSession(attemptId, paid);
    await applySessionTransition(
      'evt_paid_before_refund',
      paid,
      'paid',
    );
    await markPaymentRefunded('evt_refund', `pi_${attemptId}`);
    const order = await db.collection('orders').doc(attemptId).get();
    expect(order.data()?.payment_status).toBe('refunded');
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 0, reserved: 0, sold: 1 });
  });
});

function checkoutSession(
  orderId: string,
  overrides: Partial<Stripe.Checkout.Session> = {},
) {
  return {
    id: `cs_test_${orderId}`,
    object: 'checkout.session',
    client_reference_id: orderId,
    metadata: { order_id: orderId },
    payment_intent: null,
    customer_details: null,
    collected_information: null,
    status: 'open',
    payment_status: 'unpaid',
    expires_at: Math.floor(Date.now() / 1000) + 1800,
    url: `https://checkout.stripe.test/${orderId}`,
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

function stripeClient(
  retrieved: Stripe.Checkout.Session,
  expired: Stripe.Checkout.Session = retrieved,
) {
  return {
    checkout: {
      sessions: {
        retrieve: vi.fn().mockResolvedValue(retrieved),
        expire: vi.fn().mockResolvedValue(expired),
      },
    },
  } as unknown as Stripe;
}
