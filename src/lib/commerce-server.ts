import 'server-only';

import Stripe from 'stripe';
import {
  CURRENCY,
  CartLineInput,
  CartQuote,
  CommerceInventory,
  CommerceOrder,
  CommerceProduct,
  FulfillmentStatus,
  OrderItemSnapshot,
  PaymentStatus,
  QuoteLine,
  calculateQuoteTotals,
  getAvailableInventory,
  legacyPriceToCents,
  normalizeVariant,
  reserveInventory,
  releaseInventory,
  commitInventory,
  isVariantAllowed,
} from '@/lib/commerce';
import { getAdminDb } from '@/lib/firebase-admin';

type FirestoreData = Record<string, unknown>;

function toInteger(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
}

export function normalizeProduct(id: string, data: FirestoreData): CommerceProduct {
  const numericId = toInteger(data.id || id);
  const variantType = data.variant_type === 'one_size' ? 'one_size' : 'size';
  return {
    id: numericId,
    product_title: String(data.product_title || ''),
    slug: String(data.slug || ''),
    description: String(data.description || ''),
    image: String(data.image || ''),
    price_cents: toInteger(data.price_cents, legacyPriceToCents(data.price || '0')),
    currency: CURRENCY,
    variant_type: variantType,
    status: data.status === 'unavailable' ? 'unavailable' : 'available',
    featured: Boolean(data.featured),
    published: Boolean(data.published),
  };
}

export function normalizeInventory(data: FirestoreData): CommerceInventory {
  const onHand = toInteger(data.on_hand, toInteger(data.stock));
  const reserved = Math.min(onHand, toInteger(data.reserved));
  return {
    product_id: toInteger(data.product_id),
    variant: normalizeVariant(String(data.variant || data.size || 'OS')),
    on_hand: onHand,
    reserved,
    sold: toInteger(data.sold),
    available: getAvailableInventory(onHand, reserved),
  };
}

function assertVariantMatchesProduct(product: CommerceProduct, variant: string) {
  if (!isVariantAllowed(product.variant_type, variant)) {
    throw new Error(`${variant} is not a valid variant for ${product.product_title}.`);
  }
}

function consolidateCart(items: CartLineInput[]) {
  const consolidated = new Map<string, CartLineInput>();
  for (const item of items) {
    const variant = normalizeVariant(item.variant);
    const key = `${item.productId}_${variant}`;
    const existing = consolidated.get(key);
    consolidated.set(key, {
      productId: item.productId,
      variant,
      quantity: (existing?.quantity || 0) + item.quantity,
    });
  }
  const lines = [...consolidated.values()];
  if (lines.some(line => line.quantity > 20)) {
    throw new Error('A cart line exceeds the maximum quantity.');
  }
  return lines;
}

async function loadQuoteDocuments(items: CartLineInput[]) {
  const db = getAdminDb();
  const lines = consolidateCart(items);
  const productRefs = lines.map(item => db.collection('store_products').doc(String(item.productId)));
  const inventoryRefs = lines.map(item =>
    db.collection('product_inventory').doc(`${item.productId}_${item.variant}`),
  );
  const [productSnapshots, inventorySnapshots] = await Promise.all([
    db.getAll(...productRefs),
    db.getAll(...inventoryRefs),
  ]);
  return { lines, productSnapshots, inventorySnapshots };
}

export async function quoteCart(items: CartLineInput[]): Promise<CartQuote> {
  const { lines, productSnapshots, inventorySnapshots } = await loadQuoteDocuments(items);

  const quoteItems: QuoteLine[] = lines.map((line, index) => {
    const productSnapshot = productSnapshots[index];
    const inventorySnapshot = inventorySnapshots[index];
    if (!productSnapshot.exists || !inventorySnapshot.exists) {
      throw new Error('A cart item is no longer available.');
    }

    const product = normalizeProduct(productSnapshot.id, productSnapshot.data() as FirestoreData);
    const inventory = normalizeInventory(inventorySnapshot.data() as FirestoreData);
    if (!product.published || product.status !== 'available') {
      throw new Error(`${product.product_title || 'A product'} is unavailable.`);
    }
    assertVariantMatchesProduct(product, inventory.variant);
    if (line.quantity > inventory.available) {
      throw new Error(
        `Only ${inventory.available} units of ${product.product_title} (${inventory.variant}) are available.`,
      );
    }

    return {
      product_id: product.id,
      variant: inventory.variant,
      title: product.product_title,
      slug: product.slug,
      image: product.image,
      unit_amount: product.price_cents,
      currency: CURRENCY,
      quantity: line.quantity,
      available: inventory.available,
      line_total: product.price_cents * line.quantity,
    };
  });

  return {
    items: quoteItems,
    ...calculateQuoteTotals(quoteItems),
    currency: CURRENCY,
  };
}

export async function reserveOrder(
  checkoutAttemptId: string,
  requestedItems: CartLineInput[],
): Promise<CommerceOrder> {
  const db = getAdminDb();
  const lines = consolidateCart(requestedItems);
  const orderRef = db.collection('orders').doc(checkoutAttemptId);

  return db.runTransaction(async transaction => {
    const orderSnapshot = await transaction.get(orderRef);
    if (orderSnapshot.exists) {
      return orderSnapshot.data() as CommerceOrder;
    }

    const productRefs = lines.map(item => db.collection('store_products').doc(String(item.productId)));
    const inventoryRefs = lines.map(item =>
      db.collection('product_inventory').doc(`${item.productId}_${item.variant}`),
    );
    const productSnapshots = await transaction.getAll(...productRefs);
    const inventorySnapshots = await transaction.getAll(...inventoryRefs);

    const orderItems: OrderItemSnapshot[] = [];
    for (let index = 0; index < lines.length; index += 1) {
      const productSnapshot = productSnapshots[index];
      const inventorySnapshot = inventorySnapshots[index];
      if (!productSnapshot.exists || !inventorySnapshot.exists) {
        throw new Error('A cart item is no longer available.');
      }

      const product = normalizeProduct(productSnapshot.id, productSnapshot.data() as FirestoreData);
      const inventory = normalizeInventory(inventorySnapshot.data() as FirestoreData);
      const line = lines[index];

      if (!product.published || product.status !== 'available') {
        throw new Error(`${product.product_title || 'A product'} is unavailable.`);
      }
      assertVariantMatchesProduct(product, inventory.variant);
      if (line.quantity > inventory.available) {
        throw new Error(
          `Only ${inventory.available} units of ${product.product_title} (${inventory.variant}) are available.`,
        );
      }

      orderItems.push({
        product_id: product.id,
        variant: inventory.variant,
        title: product.product_title,
        slug: product.slug,
        image: product.image,
        unit_amount: product.price_cents,
        currency: CURRENCY,
        quantity: line.quantity,
      });
    }

    const now = new Date();
    const totals = calculateQuoteTotals(orderItems);
    const order: CommerceOrder = {
      id: checkoutAttemptId,
      checkout_attempt_id: checkoutAttemptId,
      stripe_checkout_session_id: null,
      stripe_checkout_url: null,
      stripe_payment_intent_id: null,
      payment_status: 'pending',
      fulfillment_status: 'unfulfilled',
      reservation_status: 'reserved',
      reservation_expires_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      customer_name: '',
      customer_email: '',
      shipping_address: '',
      ...totals,
      currency: CURRENCY,
      items: orderItems,
      carrier: '',
      tracking_number: '',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    for (let index = 0; index < inventorySnapshots.length; index += 1) {
      const inventory = normalizeInventory(inventorySnapshots[index].data() as FirestoreData);
      const next = reserveInventory(inventory, lines[index].quantity);
      transaction.update(inventoryRefs[index], {
        on_hand: next.on_hand,
        reserved: next.reserved,
        sold: next.sold,
        stock: next.available,
        variant: inventory.variant,
        size: inventory.variant,
        updated_at: now.toISOString(),
      });
    }

    transaction.create(orderRef, order);
    return order;
  });
}

export async function attachStripeSession(
  orderId: string,
  session: Stripe.Checkout.Session,
) {
  await getAdminDb().collection('orders').doc(orderId).update({
    order_ref: session.id,
    stripe_checkout_session_id: session.id,
    stripe_checkout_url: session.url,
    updated_at: new Date().toISOString(),
  });
}

function formatAddress(
  shipping:
    | NonNullable<Stripe.Checkout.Session['collected_information']>['shipping_details']
    | undefined,
) {
  if (!shipping) return '';
  const address = shipping.address;
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean).join(', ');
}

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  if (!session.payment_intent) return null;
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent.id;
}

type SessionTransition = 'paid' | 'processing' | 'failed' | 'expired';

export async function applySessionTransition(
  eventId: string,
  session: Stripe.Checkout.Session,
  transition: SessionTransition,
) {
  const db = getAdminDb();
  const orderId = session.client_reference_id || session.metadata?.order_id;
  if (!orderId) throw new Error('Stripe Session is missing its order reference.');

  const eventRef = db.collection('stripe_events').doc(eventId);
  const orderRef = db.collection('orders').doc(orderId);

  await db.runTransaction(async transaction => {
    const [eventSnapshot, orderSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(orderRef),
    ]);
    if (eventSnapshot.exists) return;
    if (!orderSnapshot.exists) throw new Error(`Order ${orderId} was not found.`);

    const order = orderSnapshot.data() as CommerceOrder;
    const inventoryRefs = order.items.map(item =>
      db.collection('product_inventory').doc(`${item.product_id}_${item.variant}`),
    );
    const inventorySnapshots = inventoryRefs.length
      ? await transaction.getAll(...inventoryRefs)
      : [];
    const now = new Date().toISOString();
    const updates: Partial<CommerceOrder> & Record<string, unknown> = {
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: getPaymentIntentId(session),
      processed_webhook_event_ids: [
        ...(order.processed_webhook_event_ids || []),
        eventId,
      ],
      updated_at: now,
    };

    if (transition === 'paid') {
      if (order.reservation_status === 'released') {
        throw new Error(`Order ${orderId} has no active reservation to finalize.`);
      }
      updates.payment_status = 'paid';
      updates.reservation_status = 'committed';
      updates.fulfillment_status = 'unfulfilled';
      updates.paid_at = now;
      updates.status = 'paid';
      updates.customer_name =
        session.collected_information?.shipping_details?.name
        || session.customer_details?.name
        || '';
      updates.customer_email = session.customer_details?.email || '';
      updates.shipping_address = formatAddress(
        session.collected_information?.shipping_details,
      );
      const shippingDetails = session.collected_information?.shipping_details;
      if (shippingDetails) {
        updates.shipping_details = {
          name: shippingDetails.name,
          address: {
            line1: shippingDetails.address.line1,
            line2: shippingDetails.address.line2,
            city: shippingDetails.address.city,
            state: shippingDetails.address.state,
            postal_code: shippingDetails.address.postal_code,
            country: shippingDetails.address.country,
          },
        };
      }

      if (order.reservation_status === 'reserved') {
        inventorySnapshots.forEach((snapshot, index) => {
          if (!snapshot.exists) throw new Error('Reserved inventory record is missing.');
          const inventory = normalizeInventory(snapshot.data() as FirestoreData);
          const quantity = order.items[index].quantity;
          const next = commitInventory(inventory, quantity);
          transaction.update(inventoryRefs[index], {
            on_hand: next.on_hand,
            reserved: next.reserved,
            sold: next.sold,
            stock: next.available,
            updated_at: now,
          });
        });
      }
    } else if (transition === 'processing') {
      updates.payment_status = 'processing';
      updates.status = 'pending';
    } else {
      updates.payment_status = 'failed';
      updates.reservation_status = 'released';
      updates.status = transition === 'expired' ? 'cancelled' : 'cancelled';
      if (order.reservation_status === 'reserved') {
        inventorySnapshots.forEach((snapshot, index) => {
          if (!snapshot.exists) return;
          const inventory = normalizeInventory(snapshot.data() as FirestoreData);
          const next = releaseInventory(inventory, order.items[index].quantity);
          transaction.update(inventoryRefs[index], {
            reserved: next.reserved,
            stock: next.available,
            updated_at: now,
          });
        });
      }
    }

    transaction.update(orderRef, updates);
    transaction.create(eventRef, {
      event_id: eventId,
      type: `checkout.session.${transition}`,
      order_id: orderId,
      processed_at: now,
    });
  });
}

export async function markPaymentRefunded(eventId: string, paymentIntentId: string) {
  const db = getAdminDb();
  const matches = await db.collection('orders')
    .where('stripe_payment_intent_id', '==', paymentIntentId)
    .limit(1)
    .get();
  if (matches.empty) throw new Error('Refunded order was not found.');

  const orderRef = matches.docs[0].ref;
  const eventRef = db.collection('stripe_events').doc(eventId);
  await db.runTransaction(async transaction => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) return;
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) throw new Error('Refunded order was not found.');
    const now = new Date().toISOString();
    const order = orderSnapshot.data() as CommerceOrder;
    transaction.update(orderRef, {
      payment_status: 'refunded',
      processed_webhook_event_ids: [
        ...(order.processed_webhook_event_ids || []),
        eventId,
      ],
      updated_at: now,
    });
    transaction.create(eventRef, {
      event_id: eventId,
      type: 'charge.refunded',
      order_id: orderRef.id,
      processed_at: now,
    });
  });
}

export async function releaseReservation(orderId: string) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  return db.runTransaction(async transaction => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) return false;
    const order = orderSnapshot.data() as CommerceOrder;
    if (order.reservation_status !== 'reserved' || order.payment_status === 'paid') return false;

    const inventoryRefs = order.items.map(item =>
      db.collection('product_inventory').doc(`${item.product_id}_${item.variant}`),
    );
    const inventorySnapshots = await transaction.getAll(...inventoryRefs);
    const now = new Date().toISOString();

    inventorySnapshots.forEach((snapshot, index) => {
      if (!snapshot.exists) return;
      const inventory = normalizeInventory(snapshot.data() as FirestoreData);
      const next = releaseInventory(inventory, order.items[index].quantity);
      transaction.update(inventoryRefs[index], {
        reserved: next.reserved,
        stock: next.available,
        updated_at: now,
      });
    });
    transaction.update(orderRef, {
      reservation_status: 'released',
      payment_status: 'failed',
      status: 'cancelled',
      updated_at: now,
    });
    return true;
  });
}

export async function reconcileExpiredReservations(limit = 100) {
  const db = getAdminDb();
  const snapshot = await db.collection('orders')
    .where('payment_status', '==', 'pending')
    .where('reservation_expires_at', '<=', new Date().toISOString())
    .limit(limit)
    .get();

  let released = 0;
  for (const order of snapshot.docs) {
    if (await releaseReservation(order.id)) released += 1;
  }
  return { scanned: snapshot.size, released };
}

export async function listAdminCommerce() {
  const db = getAdminDb();
  const [products, inventory, orders] = await Promise.all([
    db.collection('store_products').get(),
    db.collection('product_inventory').get(),
    db.collection('orders').orderBy('created_at', 'desc').limit(250).get(),
  ]);
  return {
    products: products.docs.map(doc => {
      const product = normalizeProduct(doc.id, doc.data());
      return {
        ...product,
        price: `$${(product.price_cents / 100).toFixed(2)}`,
      };
    }),
    inventory: inventory.docs.map(doc => normalizeInventory(doc.data())),
    orders: orders.docs.map(doc => {
      const data = doc.data();
      const legacy = normalizeLegacyOrderStatus(data.status);
      const items = Array.isArray(data.items) ? data.items : [];
      return {
        ...data,
        id: doc.id,
        order_ref: data.stripe_checkout_session_id || data.order_ref || doc.id,
        customer_name: data.customer_name || '',
        customer_email: data.customer_email || '',
        shipping_address: data.shipping_address || '',
        total_amount: typeof data.total_cents === 'number'
          ? data.total_cents / 100
          : Number(data.total_amount || 0),
        payment_status: data.payment_status || legacy.payment_status,
        fulfillment_status: data.fulfillment_status || legacy.fulfillment_status,
        status: data.status || 'pending',
        items: items.map((item: Record<string, unknown>) => ({
          id: Number(item.product_id ?? item.id),
          product_title: String(item.title ?? item.product_title ?? ''),
          price: typeof item.unit_amount === 'number'
            ? `$${(item.unit_amount / 100).toFixed(2)}`
            : String(item.price || ''),
          quantity: Number(item.quantity || 0),
          size: String(item.variant ?? item.size ?? ''),
        })),
      };
    }),
  };
}

export async function saveCommerceProduct(
  actor: { uid: string; email: string },
  product: CommerceProduct,
  inventory: Array<{ variant: string; on_hand: number }>,
) {
  const db = getAdminDb();
  const productRef = db.collection('store_products').doc(String(product.id));
  const now = new Date().toISOString();

  await db.runTransaction(async transaction => {
    const inventoryRefs = inventory.map(item =>
      db.collection('product_inventory').doc(`${product.id}_${normalizeVariant(item.variant)}`),
    );
    const inventorySnapshots = inventoryRefs.length
      ? await transaction.getAll(...inventoryRefs)
      : [];

    transaction.set(productRef, {
      ...product,
      price: `$${(product.price_cents / 100).toFixed(2)}`,
      updated_at: now,
    }, { merge: true });

    inventory.forEach((item, index) => {
      const current = inventorySnapshots[index]?.exists
        ? normalizeInventory(inventorySnapshots[index].data() as FirestoreData)
        : null;
      const variant = normalizeVariant(item.variant);
      const onHand = toInteger(item.on_hand);
      const reserved = Math.min(onHand, current?.reserved || 0);
      transaction.set(inventoryRefs[index], {
        product_id: product.id,
        variant,
        size: variant,
        on_hand: onHand,
        reserved,
        sold: current?.sold || 0,
        stock: getAvailableInventory(onHand, reserved),
        updated_at: now,
      }, { merge: true });
    });

    transaction.create(db.collection('inventory_audit').doc(), {
      actor_uid: actor.uid,
      actor_email: actor.email,
      product_id: product.id,
      action: 'product_inventory_save',
      inventory,
      created_at: now,
    });
  });
}

export async function archiveCommerceProduct(
  actor: { uid: string; email: string },
  productId: number,
) {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const batch = db.batch();
  batch.set(db.collection('store_products').doc(String(productId)), {
    published: false,
    status: 'unavailable',
    updated_at: now,
  }, { merge: true });
  batch.create(db.collection('inventory_audit').doc(), {
    actor_uid: actor.uid,
    actor_email: actor.email,
    product_id: productId,
    action: 'product_archived',
    created_at: now,
  });
  await batch.commit();
}

export async function updateOrderFulfillment(
  actor: { uid: string; email: string },
  orderId: string,
  fulfillmentStatus: FulfillmentStatus,
  carrier: string,
  trackingNumber: string,
) {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const orderRef = db.collection('orders').doc(orderId);
  const auditRef = db.collection('order_audit').doc();
  await db.runTransaction(async transaction => {
    const order = await transaction.get(orderRef);
    if (!order.exists) throw new Error('Order not found.');
    transaction.update(orderRef, {
      fulfillment_status: fulfillmentStatus,
      carrier: carrier.trim(),
      tracking_number: trackingNumber.trim(),
      status: fulfillmentStatus === 'completed' ? 'completed' : order.data()?.status,
      ...(fulfillmentStatus === 'shipped' ? { shipped_at: now } : {}),
      ...(fulfillmentStatus === 'completed' ? { completed_at: now } : {}),
      updated_at: now,
    });
    transaction.create(auditRef, {
      actor_uid: actor.uid,
      actor_email: actor.email,
      order_id: orderId,
      action: 'fulfillment_update',
      fulfillment_status: fulfillmentStatus,
      carrier: carrier.trim(),
      tracking_number: trackingNumber.trim(),
      created_at: now,
    });
  });
}

export function normalizeLegacyOrderStatus(value: unknown): {
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
} {
  if (value === 'paid') return { payment_status: 'paid', fulfillment_status: 'unfulfilled' };
  if (value === 'completed') return { payment_status: 'paid', fulfillment_status: 'completed' };
  if (value === 'cancelled') return { payment_status: 'failed', fulfillment_status: 'cancelled' };
  return { payment_status: 'pending', fulfillment_status: 'unfulfilled' };
}
