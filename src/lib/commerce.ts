import { z } from 'zod';

export const SHIPPING_CENTS = 500;
export const RESERVATION_MINUTES = 30;
export const CURRENCY = 'usd';
export const APPAREL_VARIANTS = ['S', 'M', 'L', 'XL'] as const;

export const cartLineSchema = z.object({
  productId: z.number().int().positive(),
  variant: z.string().trim().min(1).max(32).transform(value => value.toUpperCase()),
  quantity: z.number().int().min(1).max(20),
});

export const cartRequestSchema = z.object({
  items: z.array(cartLineSchema).min(1).max(50),
});

export const checkoutRequestSchema = cartRequestSchema.extend({
  checkoutAttemptId: z.string().uuid(),
});

export type CartLineInput = z.infer<typeof cartLineSchema>;

export interface CommerceProduct {
  id: number;
  product_title: string;
  slug: string;
  description: string;
  image: string;
  price_cents: number;
  currency: typeof CURRENCY;
  variant_type: 'size' | 'one_size';
  status: 'available' | 'unavailable';
  featured: boolean;
  published: boolean;
}

export interface CommerceInventory {
  product_id: number;
  variant: string;
  on_hand: number;
  reserved: number;
  sold: number;
  available: number;
}

export interface OrderItemSnapshot {
  product_id: number;
  variant: string;
  title: string;
  slug: string;
  image: string;
  unit_amount: number;
  currency: typeof CURRENCY;
  quantity: number;
}

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'completed' | 'cancelled';
export type ReservationStatus = 'reserved' | 'committed' | 'released';

export interface CommerceOrder {
  id: string;
  checkout_attempt_id: string;
  stripe_checkout_session_id: string | null;
  stripe_checkout_url: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  reservation_status: ReservationStatus;
  reservation_expires_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: typeof CURRENCY;
  items: OrderItemSnapshot[];
  carrier: string;
  tracking_number: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  shipping_details?: {
    name: string;
    address: Record<string, string | null>;
  };
  processed_webhook_event_ids?: string[];
}

export interface QuoteLine extends OrderItemSnapshot {
  available: number;
  line_total: number;
}

export interface CartQuote {
  items: QuoteLine[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: typeof CURRENCY;
}

export function legacyPriceToCents(price: unknown): number {
  if (typeof price === 'number' && Number.isInteger(price) && price >= 0) {
    return price;
  }
  if (typeof price !== 'string') {
    throw new Error('Product price is missing.');
  }
  const value = Number(price.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid product price: ${price}`);
  }
  return Math.round(value * 100);
}

export function formatMoney(cents: number, currency = CURRENCY): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function calculateQuoteTotals(items: Array<{ unit_amount: number; quantity: number }>) {
  const subtotal_cents = items.reduce(
    (sum, item) => sum + item.unit_amount * item.quantity,
    0,
  );
  return {
    subtotal_cents,
    shipping_cents: SHIPPING_CENTS,
    total_cents: subtotal_cents + SHIPPING_CENTS,
  };
}

export function getAvailableInventory(onHand: number, reserved: number) {
  return Math.max(0, onHand - reserved);
}

export function normalizeVariant(value: string) {
  return value.trim().toUpperCase();
}

export function isVariantAllowed(
  variantType: CommerceProduct['variant_type'],
  variant: string,
) {
  const normalized = normalizeVariant(variant);
  return variantType === 'one_size'
    ? normalized === 'OS'
    : APPAREL_VARIANTS.some(value => value === normalized);
}

export function reserveInventory(
  inventory: Pick<CommerceInventory, 'on_hand' | 'reserved' | 'sold'>,
  quantity: number,
) {
  const available = getAvailableInventory(inventory.on_hand, inventory.reserved);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > available) {
    throw new Error(`Only ${available} units are available.`);
  }
  const reserved = inventory.reserved + quantity;
  return {
    ...inventory,
    reserved,
    available: getAvailableInventory(inventory.on_hand, reserved),
  };
}

export function releaseInventory(
  inventory: Pick<CommerceInventory, 'on_hand' | 'reserved' | 'sold'>,
  quantity: number,
) {
  const reserved = Math.max(0, inventory.reserved - quantity);
  return {
    ...inventory,
    reserved,
    available: getAvailableInventory(inventory.on_hand, reserved),
  };
}

export function commitInventory(
  inventory: Pick<CommerceInventory, 'on_hand' | 'reserved' | 'sold'>,
  quantity: number,
) {
  const on_hand = Math.max(0, inventory.on_hand - quantity);
  const reserved = Math.max(0, inventory.reserved - quantity);
  return {
    on_hand,
    reserved,
    sold: inventory.sold + quantity,
    available: getAvailableInventory(on_hand, reserved),
  };
}
