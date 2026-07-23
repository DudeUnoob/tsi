import { randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const emulatorEnabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const describeEmulator = emulatorEnabled ? describe : describe.skip;

describeEmulator('commerce Firestore transactions', () => {
  let db: ReturnType<typeof import('./firebase-admin')['getAdminDb']>;
  let reserveOrder: typeof import('./commerce-server')['reserveOrder'];
  let releaseReservation: typeof import('./commerce-server')['releaseReservation'];
  let applySessionTransition: typeof import('./commerce-server')['applySessionTransition'];
  const productId = 990001;
  const inventoryId = `${productId}_M`;

  beforeAll(async () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID ||= 'tsiwebsite-commerce-test';
    const admin = await import('./firebase-admin');
    db = admin.getAdminDb();
    ({ reserveOrder, releaseReservation, applySessionTransition } =
      await import('./commerce-server'));
  });

  beforeEach(async () => {
    const orders = await db.collection('orders').get();
    const events = await db.collection('stripe_events').get();
    const batch = db.batch();
    orders.docs.forEach(document => batch.delete(document.ref));
    events.docs.forEach(document => batch.delete(document.ref));
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
  });

  it('releases reservations idempotently', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    expect(await releaseReservation(attemptId)).toBe(true);
    expect(await releaseReservation(attemptId)).toBe(false);
    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 1, reserved: 0, sold: 0, stock: 1 });
  });

  it('commits inventory once when webhook events are replayed', async () => {
    const attemptId = randomUUID();
    await reserveOrder(attemptId, [{ productId, variant: 'M', quantity: 1 }]);
    const session = {
      id: `cs_test_${attemptId}`,
      client_reference_id: attemptId,
      metadata: { order_id: attemptId },
      payment_intent: `pi_test_${attemptId}`,
      customer_details: { email: 'buyer@example.com', name: 'Buyer' },
    } as unknown as Stripe.Checkout.Session;

    await applySessionTransition('evt_paid_once', session, 'paid');
    await applySessionTransition('evt_paid_once', session, 'paid');
    await applySessionTransition('evt_paid_duplicate_delivery', session, 'paid');

    const inventory = await db.collection('product_inventory').doc(inventoryId).get();
    expect(inventory.data()).toMatchObject({ on_hand: 0, reserved: 0, sold: 1, stock: 0 });
  });
});
