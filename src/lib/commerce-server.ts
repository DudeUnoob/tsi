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
  commitUnreservedInventory,
  createCartFingerprint,
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

export class InventoryUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryUnavailableError';
  }
}

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
  const reserved = toInteger(data.reserved);
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
      throw new InventoryUnavailableError('A cart item is no longer available.');
    }

    const product = normalizeProduct(productSnapshot.id, productSnapshot.data() as FirestoreData);
    const inventory = normalizeInventory(inventorySnapshot.data() as FirestoreData);
    if (!product.published || product.status !== 'available') {
      throw new Error(`${product.product_title || 'A product'} is unavailable.`);
    }
    assertVariantMatchesProduct(product, inventory.variant);
    if (line.quantity > inventory.available) {
      throw new InventoryUnavailableError(
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
  const cartFingerprint = createCartFingerprint(lines);
  const orderRef = db.collection('orders').doc(checkoutAttemptId);
  const auditRef = db.collection('inventory_audit').doc();

  return db.runTransaction(async transaction => {
    const orderSnapshot = await transaction.get(orderRef);
    if (orderSnapshot.exists) {
      const existingOrder = orderSnapshot.data() as CommerceOrder;
      if (
        existingOrder.cart_fingerprint
        && existingOrder.cart_fingerprint !== cartFingerprint
      ) {
        throw new Error('This checkout attempt belongs to a different cart.');
      }
      return existingOrder;
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
        throw new InventoryUnavailableError('A cart item is no longer available.');
      }

      const product = normalizeProduct(productSnapshot.id, productSnapshot.data() as FirestoreData);
      const inventory = normalizeInventory(inventorySnapshot.data() as FirestoreData);
      const line = lines[index];

      if (!product.published || product.status !== 'available') {
        throw new Error(`${product.product_title || 'A product'} is unavailable.`);
      }
      assertVariantMatchesProduct(product, inventory.variant);
      if (line.quantity > inventory.available) {
        throw new InventoryUnavailableError(
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
      cart_fingerprint: cartFingerprint,
      inventory_keys: orderItems.map(item => `${item.product_id}_${item.variant}`),
      stripe_session_status: null,
      stripe_payment_status: null,
      last_transition_source: 'checkout.reserve',
      inventory_exception: false,
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
        variant: inventory.variant,
        size: inventory.variant,
        updated_at: now.toISOString(),
      });
    }

    transaction.create(orderRef, order);
    transaction.create(auditRef, {
      order_id: checkoutAttemptId,
      action: 'checkout_reserved',
      source: 'checkout.reserve',
      items: orderItems.map(item => ({
        product_id: item.product_id,
        variant: item.variant,
        quantity: item.quantity,
      })),
      created_at: now.toISOString(),
    });
    return order;
  });
}

export async function attachStripeSession(
  orderId: string,
  session: Stripe.Checkout.Session,
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists) throw new Error(`Order ${orderId} was not found.`);
    const order = snapshot.data() as CommerceOrder;
    if (
      order.stripe_checkout_session_id
      && order.stripe_checkout_session_id !== session.id
    ) {
      throw new Error('This checkout attempt is already attached to another Stripe Session.');
    }
    transaction.update(orderRef, {
      order_ref: session.id,
      stripe_checkout_session_id: session.id,
      stripe_checkout_url: session.url,
      stripe_session_status: session.status,
      stripe_payment_status: session.payment_status,
      reservation_expires_at: new Date(session.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
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

export type SessionTransition = 'paid' | 'processing' | 'failed' | 'expired';

export interface SessionTransitionResult {
  applied: boolean;
  inventoryException: boolean;
  paymentStatus: PaymentStatus;
  reservationStatus: CommerceOrder['reservation_status'];
  reason: string;
}

export async function applySessionTransition(
  eventId: string,
  session: Stripe.Checkout.Session,
  transition: SessionTransition,
  source = 'stripe.webhook',
): Promise<SessionTransitionResult> {
  const db = getAdminDb();
  const sessionReferences = [
    session.client_reference_id,
    session.metadata?.order_id,
  ].filter((value): value is string => Boolean(value));
  const orderId = sessionReferences[0];
  if (!orderId) throw new Error('Stripe Session is missing its order reference.');
  if (sessionReferences.some(reference => reference !== orderId)) {
    throw new Error('Stripe Session order references do not match.');
  }

  const eventRef = db.collection('stripe_events').doc(eventId);
  const orderRef = db.collection('orders').doc(orderId);
  const orderAuditRef = db.collection('order_audit').doc();
  const inventoryAuditRef = db.collection('inventory_audit').doc();

  return db.runTransaction(async transaction => {
    const [eventSnapshot, orderSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(orderRef),
    ]);
    if (!orderSnapshot.exists) throw new Error(`Order ${orderId} was not found.`);

    const order = orderSnapshot.data() as CommerceOrder;
    if (order.stripe_checkout_session_id !== session.id) {
      throw new Error('Stripe Session does not belong to this order.');
    }
    if (eventSnapshot.exists) {
      return {
        applied: false,
        inventoryException: Boolean(order.inventory_exception),
        paymentStatus: order.payment_status,
        reservationStatus: order.reservation_status,
        reason: 'duplicate_event',
      };
    }

    const inventoryRefs = order.items.map(item =>
      db.collection('product_inventory').doc(`${item.product_id}_${item.variant}`),
    );
    const inventorySnapshots = inventoryRefs.length
      ? await transaction.getAll(...inventoryRefs)
      : [];
    const now = new Date().toISOString();
    const processedEventIds = [
      ...(order.processed_webhook_event_ids || []),
      eventId,
    ].slice(-100);
    const updates: Partial<CommerceOrder> & Record<string, unknown> = {
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        getPaymentIntentId(session) || order.stripe_payment_intent_id || null,
      processed_webhook_event_ids: processedEventIds,
      updated_at: now,
    };
    const inventoryWrites: Array<{
      index: number;
      values: Pick<CommerceInventory, 'on_hand' | 'reserved' | 'sold'>;
    }> = [];
    let applied = false;
    let inventoryException = Boolean(order.inventory_exception);
    let reason = 'stale_event';

    if (transition === 'paid') {
      if (order.payment_status === 'refunded') {
        reason = 'paid_event_after_refund';
      } else if (order.reservation_status === 'committed') {
        updates.payment_status = 'paid';
        updates.status = 'paid';
        reason = 'already_committed';
      } else {
        const inventories = inventorySnapshots.map(snapshot =>
          snapshot.exists
            ? normalizeInventory(snapshot.data() as FirestoreData)
            : null,
        );
        const canAllocate = inventories.every((inventory, index) => {
          if (!inventory) return false;
          const quantity = order.items[index].quantity;
          return order.reservation_status === 'reserved'
            ? inventory.on_hand >= quantity && inventory.reserved >= quantity
            : inventory.available >= quantity;
        });

        if (canAllocate) {
          inventories.forEach((inventory, index) => {
            const quantity = order.items[index].quantity;
            const next = order.reservation_status === 'reserved'
              ? commitInventory(inventory!, quantity)
              : commitUnreservedInventory(inventory!, quantity);
            inventoryWrites.push({ index, values: next });
          });
          updates.reservation_status = 'committed';
          updates.inventory_exception = false;
          updates.inventory_exception_details = [];
          inventoryException = false;
          reason = order.reservation_status === 'reserved'
            ? 'reserved_inventory_committed'
            : 'late_payment_reallocated';
        } else {
          const details = order.items.flatMap((item, index) => {
            const inventory = inventories[index];
            const available = inventory?.available ?? 0;
            const reserved = inventory?.reserved ?? 0;
            const needed = item.quantity;
            const enough = order.reservation_status === 'reserved'
              ? Boolean(inventory && inventory.on_hand >= needed && reserved >= needed)
              : available >= needed;
            return enough
              ? []
              : [`${item.product_id}_${item.variant}: needs ${needed}, available ${available}, reserved ${reserved}`];
          });
          updates.inventory_exception = true;
          updates.inventory_exception_details = details;
          inventoryException = true;
          reason = 'paid_without_allocatable_inventory';
        }

        updates.payment_status = 'paid';
        updates.fulfillment_status = 'unfulfilled';
        updates.paid_at = order.paid_at || now;
        updates.status = 'paid';
        updates.stripe_session_status = session.status;
        updates.stripe_payment_status = session.payment_status;
        updates.last_transition_source = source;
        updates.customer_name =
          session.collected_information?.shipping_details?.name
          || session.customer_details?.name
          || order.customer_name
          || '';
        updates.customer_email = session.customer_details?.email || order.customer_email || '';
        updates.shipping_address = formatAddress(
          session.collected_information?.shipping_details,
        ) || order.shipping_address;
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
        applied = true;
      }
    } else if (transition === 'processing') {
      if (
        order.reservation_status === 'reserved'
        && (order.payment_status === 'pending' || order.payment_status === 'processing')
      ) {
        updates.payment_status = 'processing';
        updates.status = 'pending';
        updates.stripe_session_status = session.status;
        updates.stripe_payment_status = session.payment_status;
        updates.last_transition_source = source;
        applied = order.payment_status !== 'processing';
        reason = 'payment_processing';
      }
    } else {
      if (
        order.reservation_status === 'reserved'
        && order.payment_status !== 'paid'
        && order.payment_status !== 'refunded'
      ) {
        if (
          inventorySnapshots.length !== order.items.length
          || inventorySnapshots.some(snapshot => !snapshot.exists)
        ) {
          throw new Error('Reserved inventory is missing; the reservation was retained.');
        }
        inventorySnapshots.forEach((snapshot, index) => {
          const inventory = normalizeInventory(snapshot.data() as FirestoreData);
          const next = releaseInventory(inventory, order.items[index].quantity);
          inventoryWrites.push({ index, values: next });
        });
        updates.payment_status = 'failed';
        updates.reservation_status = 'released';
        updates.reservation_released_at = now;
        updates.reservation_release_reason = transition;
        updates.status = 'cancelled';
        updates.stripe_session_status = session.status;
        updates.stripe_payment_status = session.payment_status;
        updates.last_transition_source = source;
        applied = true;
        reason = transition === 'expired' ? 'stripe_session_expired' : 'asynchronous_payment_failed';
      }
    }

    inventoryWrites.forEach(({ index, values }) => {
      transaction.update(inventoryRefs[index], {
        on_hand: values.on_hand,
        reserved: values.reserved,
        sold: values.sold,
        updated_at: now,
      });
    });
    transaction.update(orderRef, updates);
    transaction.create(eventRef, {
      event_id: eventId,
      type: `checkout.session.${transition}`,
      order_id: orderId,
      source,
      applied,
      reason,
      processed_at: now,
    });
    transaction.create(orderAuditRef, {
      order_id: orderId,
      action: `checkout_${transition}`,
      source,
      applied,
      reason,
      created_at: now,
    });
    if (inventoryWrites.length || inventoryException) {
      transaction.create(inventoryAuditRef, {
        order_id: orderId,
        action: inventoryException ? 'inventory_exception' : `checkout_${transition}`,
        source,
        items: order.items.map(item => ({
          product_id: item.product_id,
          variant: item.variant,
          quantity: item.quantity,
        })),
        created_at: now,
      });
    }

    return {
      applied,
      inventoryException,
      paymentStatus: (updates.payment_status || order.payment_status) as PaymentStatus,
      reservationStatus:
        (updates.reservation_status || order.reservation_status) as CommerceOrder['reservation_status'],
      reason,
    };
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
  const auditRef = db.collection('order_audit').doc();
  await db.runTransaction(async transaction => {
    const eventSnapshot = await transaction.get(eventRef);
    if (eventSnapshot.exists) return;
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) throw new Error('Refunded order was not found.');
    const now = new Date().toISOString();
    const order = orderSnapshot.data() as CommerceOrder;
    const applied = order.payment_status === 'paid';
    transaction.update(orderRef, {
      ...(applied ? { payment_status: 'refunded' as const } : {}),
      processed_webhook_event_ids: [
        ...(order.processed_webhook_event_ids || []),
        eventId,
      ].slice(-100),
      last_transition_source: 'stripe.webhook',
      updated_at: now,
    });
    transaction.create(eventRef, {
      event_id: eventId,
      type: 'charge.refunded',
      order_id: orderRef.id,
      applied,
      processed_at: now,
    });
    transaction.create(auditRef, {
      order_id: orderRef.id,
      action: 'payment_refunded',
      source: 'stripe.webhook',
      applied,
      created_at: now,
    });
  });
}

export async function releaseReservation(
  orderId: string,
  options: {
    reason?: string;
    source?: string;
    allowAttachedSession?: boolean;
  } = {},
) {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderAuditRef = db.collection('order_audit').doc();
  const inventoryAuditRef = db.collection('inventory_audit').doc();
  return db.runTransaction(async transaction => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) return false;
    const order = orderSnapshot.data() as CommerceOrder;
    if (order.reservation_status !== 'reserved' || order.payment_status === 'paid') return false;
    if (order.stripe_checkout_session_id && !options.allowAttachedSession) {
      throw new Error('An attached Stripe Session must be verified before releasing inventory.');
    }

    const inventoryRefs = order.items.map(item =>
      db.collection('product_inventory').doc(`${item.product_id}_${item.variant}`),
    );
    const inventorySnapshots = await transaction.getAll(...inventoryRefs);
    const now = new Date().toISOString();

    if (
      inventorySnapshots.length !== order.items.length
      || inventorySnapshots.some(snapshot => !snapshot.exists)
    ) {
      throw new Error('Reserved inventory is missing; the reservation was retained.');
    }
    inventorySnapshots.forEach((snapshot, index) => {
      const inventory = normalizeInventory(snapshot.data() as FirestoreData);
      const next = releaseInventory(inventory, order.items[index].quantity);
      transaction.update(inventoryRefs[index], {
        on_hand: next.on_hand,
        reserved: next.reserved,
        sold: next.sold,
        updated_at: now,
      });
    });
    const source = options.source || 'checkout.release';
    const reason = options.reason || 'checkout_creation_failed';
    transaction.update(orderRef, {
      reservation_status: 'released',
      payment_status: 'failed',
      status: 'cancelled',
      reservation_released_at: now,
      reservation_release_reason: reason,
      last_transition_source: source,
      updated_at: now,
    });
    transaction.create(orderAuditRef, {
      order_id: orderId,
      action: 'checkout_released',
      source,
      reason,
      created_at: now,
    });
    transaction.create(inventoryAuditRef, {
      order_id: orderId,
      action: 'checkout_released',
      source,
      reason,
      items: order.items.map(item => ({
        product_id: item.product_id,
        variant: item.variant,
        quantity: item.quantity,
      })),
      created_at: now,
    });
    return true;
  });
}

export interface CheckoutOrderState {
  orderId: string;
  sessionId: string | null;
  sessionStatus: Stripe.Checkout.Session['status'] | null;
  paymentStatus: PaymentStatus;
  reservationStatus: CommerceOrder['reservation_status'];
  expiresAt: string;
  url: string | null;
  inventoryException: boolean;
}

async function readOrder(orderId: string) {
  const snapshot = await getAdminDb().collection('orders').doc(orderId).get();
  if (!snapshot.exists) throw new Error('Checkout attempt was not found.');
  return snapshot.data() as CommerceOrder;
}

function transitionForSession(session: Stripe.Checkout.Session): SessionTransition | null {
  if (session.payment_status === 'paid') return 'paid';
  if (session.status === 'expired') return 'expired';
  if (session.status === 'complete') return 'processing';
  return null;
}

function toCheckoutOrderState(
  orderId: string,
  order: CommerceOrder,
  session?: Stripe.Checkout.Session,
): CheckoutOrderState {
  return {
    orderId,
    sessionId: session?.id || order.stripe_checkout_session_id,
    sessionStatus: session?.status || order.stripe_session_status || null,
    paymentStatus: order.payment_status,
    reservationStatus: order.reservation_status,
    expiresAt: order.reservation_expires_at,
    url: session
      ? (session.status === 'open' ? session.url : null)
      : (order.reservation_status === 'reserved' ? order.stripe_checkout_url : null),
    inventoryException: Boolean(order.inventory_exception),
  };
}

export async function synchronizeCheckoutOrder(
  stripe: Stripe,
  orderId: string,
  mode: 'status' | 'cancel' | 'reconcile',
): Promise<CheckoutOrderState> {
  let order = await readOrder(orderId);
  const sessionId = order.stripe_checkout_session_id;

  if (!sessionId) {
    if (
      order.reservation_status === 'reserved'
      && (mode === 'cancel' || Date.parse(order.reservation_expires_at) <= Date.now())
    ) {
      await releaseReservation(orderId, {
        source: `checkout.${mode}`,
        reason: mode === 'cancel' ? 'explicit_cancel_without_session' : 'expired_without_session',
      });
      order = await readOrder(orderId);
    }
    return toCheckoutOrderState(orderId, order);
  }

  let session = await stripe.checkout.sessions.retrieve(sessionId);
  let transition = transitionForSession(session);

  if (
    !transition
    && session.status === 'open'
    && (mode === 'cancel' || session.expires_at * 1000 <= Date.now())
  ) {
    try {
      session = await stripe.checkout.sessions.expire(
        session.id,
        {},
        { idempotencyKey: `expire-${orderId}` },
      );
    } catch {
      // Payment completion and expiration can race. Never release based on the
      // error; retrieve Stripe's final state and apply that instead.
      session = await stripe.checkout.sessions.retrieve(session.id);
    }
    transition = transitionForSession(session);
  }

  if (transition) {
    await applySessionTransition(
      `sync_${session.id}_${transition}`,
      session,
      transition,
      `checkout.${mode}`,
    );
    order = await readOrder(orderId);
  }

  return toCheckoutOrderState(orderId, order, session);
}

export async function reconcileExpiredReservations(stripe: Stripe, limit = 100) {
  const db = getAdminDb();
  const snapshot = await db.collection('orders')
    .where('reservation_status', '==', 'reserved')
    .where('reservation_expires_at', '<=', new Date().toISOString())
    .limit(limit)
    .get();

  const result = {
    scanned: snapshot.size,
    released: 0,
    finalized: 0,
    processing: 0,
    unchanged: 0,
    errors: 0,
  };
  for (const order of snapshot.docs) {
    try {
      const state = await synchronizeCheckoutOrder(stripe, order.id, 'reconcile');
      if (state.reservationStatus === 'released') result.released += 1;
      else if (state.reservationStatus === 'committed') result.finalized += 1;
      else if (state.paymentStatus === 'processing') result.processing += 1;
      else result.unchanged += 1;
    } catch (error) {
      result.errors += 1;
      console.error('Checkout reconciliation retained reservation after error:', {
        orderId: order.id,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  return result;
}

export async function reconcileExpiredReservationsForItems(
  stripe: Stripe,
  items: CartLineInput[],
) {
  const db = getAdminDb();
  const inventoryKeys = [
    ...new Set(
      consolidateCart(items).map(item => `${item.productId}_${item.variant}`),
    ),
  ];
  const snapshots = await Promise.all(
    inventoryKeys.map(inventoryKey =>
      db.collection('orders')
        .where('inventory_keys', 'array-contains', inventoryKey)
        .where('reservation_status', '==', 'reserved')
        .where('reservation_expires_at', '<=', new Date().toISOString())
        .limit(20)
        .get(),
    ),
  );
  const relevantOrders = new Map(
    snapshots.flatMap(snapshot => snapshot.docs).map(document => [document.id, document]),
  );
  const result = {
    scanned: relevantOrders.size,
    released: 0,
    finalized: 0,
    processing: 0,
    unchanged: 0,
    errors: 0,
  };
  for (const order of relevantOrders.values()) {
    try {
      const state = await synchronizeCheckoutOrder(stripe, order.id, 'reconcile');
      if (state.reservationStatus === 'released') result.released += 1;
      else if (state.reservationStatus === 'committed') result.finalized += 1;
      else if (state.paymentStatus === 'processing') result.processing += 1;
      else result.unchanged += 1;
    } catch (error) {
      result.errors += 1;
      console.error('Relevant checkout reconciliation retained reservation after error:', {
        orderId: order.id,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  return result;
}

export async function retryInventoryAllocation(
  stripe: Stripe,
  orderId: string,
  actor: { uid: string; email: string },
) {
  const order = await readOrder(orderId);
  if (!order.inventory_exception || !order.stripe_checkout_session_id) {
    throw new Error('This order does not have a resolvable inventory exception.');
  }
  const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
  if (session.payment_status !== 'paid') {
    throw new Error('Stripe does not report this order as paid.');
  }
  const result = await applySessionTransition(
    `admin_retry_${session.id}_${Date.now()}`,
    session,
    'paid',
    'admin.inventory_resolution',
  );
  await getAdminDb().collection('order_audit').add({
    order_id: orderId,
    action: 'inventory_exception_retry',
    actor_uid: actor.uid,
    actor_email: actor.email,
    resolved: !result.inventoryException,
    created_at: new Date().toISOString(),
  });
  return result;
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
  const normalizedVariants = inventory.map(item => normalizeVariant(item.variant));
  if (new Set(normalizedVariants).size !== normalizedVariants.length) {
    throw new Error('Inventory variants must be unique.');
  }
  normalizedVariants.forEach(variant => assertVariantMatchesProduct(product, variant));

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
      const reserved = current?.reserved || 0;
      if (onHand < reserved) {
        throw new Error(
          `${variant} has ${reserved} units reserved. On-hand inventory cannot be set below that value.`,
        );
      }
      transaction.set(inventoryRefs[index], {
        product_id: product.id,
        variant,
        size: variant,
        on_hand: onHand,
        reserved,
        sold: current?.sold || 0,
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
    if (order.data()?.inventory_exception) {
      throw new Error('Resolve the inventory exception before updating fulfillment.');
    }
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
