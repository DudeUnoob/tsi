import type { CartQuote } from '@/lib/commerce';

export const ACTIVE_CHECKOUT_KEY = 'sanga_active_checkout';
export const ACTIVE_CHECKOUT_CHANGED_EVENT = 'sanga-active-checkout-changed';
export const CART_STORAGE_KEY = 'sanga_cart';
export const COMMERCE_BROWSER_LOCK = 'sanga-commerce-cart';

export type ActiveCheckout = {
  id: string;
  cartKey: string;
  token?: string;
  expiresAt?: string;
  quote: CartQuote;
};

export type CheckoutClientState = {
  orderId: string;
  sessionId: string | null;
  sessionStatus: 'open' | 'complete' | 'expired' | null;
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  reservationStatus: 'reserved' | 'committed' | 'released';
  expiresAt: string;
  url: string | null;
  inventoryException: boolean;
};

export function parseStoredCheckout(raw: string | null): ActiveCheckout | null {
  if (!raw) return null;
  const value = JSON.parse(raw) as Partial<ActiveCheckout>;
  if (
    typeof value.id !== 'string'
    || typeof value.cartKey !== 'string'
    || !value.quote
    || !Array.isArray(value.quote.items)
    || (value.token !== undefined && typeof value.token !== 'string')
    || (value.expiresAt !== undefined && typeof value.expiresAt !== 'string')
  ) {
    throw new Error('Invalid stored checkout attempt.');
  }
  return value as ActiveCheckout;
}

export function readStoredCheckout(storage: Storage): ActiveCheckout | null {
  return parseStoredCheckout(storage.getItem(ACTIVE_CHECKOUT_KEY));
}

export function writeStoredCheckout(storage: Storage, value: ActiveCheckout | null) {
  if (value) storage.setItem(ACTIVE_CHECKOUT_KEY, JSON.stringify(value));
  else storage.removeItem(ACTIVE_CHECKOUT_KEY);
}

export function notifyActiveCheckoutChanged() {
  window.dispatchEvent(new Event(ACTIVE_CHECKOUT_CHANGED_EVENT));
}

export function canMutateCartAfterCheckout(state: CheckoutClientState) {
  return state.reservationStatus === 'released'
    && state.sessionStatus !== 'open'
    && state.paymentStatus !== 'processing'
    && state.paymentStatus !== 'paid'
    && state.paymentStatus !== 'refunded';
}

export function shouldClearCartAfterCheckout(
  activeCheckout: ActiveCheckout | null,
  completedOrderId: string,
) {
  return activeCheckout?.id === completedOrderId;
}

export function checkoutAttemptMatchesCurrentCart(
  activeCheckout: ActiveCheckout | null,
  currentCartKey: string,
  attempt: Pick<ActiveCheckout, 'id' | 'cartKey'>,
) {
  return (
    activeCheckout?.id === attempt.id
    && currentCartKey === attempt.cartKey
  );
}

export function createStoredCartRequestKey(raw: string | null) {
  if (!raw) return JSON.stringify([]);
  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value)) throw new Error('Invalid stored cart.');
  const request = value.map(item => {
    if (
      !item
      || typeof item !== 'object'
      || !Number.isInteger((item as { id?: unknown }).id)
      || typeof (item as { size?: unknown }).size !== 'string'
      || !Number.isInteger((item as { quantity?: unknown }).quantity)
      || Number((item as { quantity?: unknown }).quantity) <= 0
    ) {
      throw new Error('Invalid stored cart.');
    }
    const line = item as { id: number; size: string; quantity: number };
    return {
      productId: line.id,
      variant: line.size,
      quantity: line.quantity,
    };
  });
  return JSON.stringify(request);
}

export async function withCommerceBrowserLock<T>(task: () => Promise<T>): Promise<T> {
  if (!navigator.locks?.request) {
    throw new Error(
      'This browser cannot safely coordinate merchandise checkout across tabs. Update your browser and try again.',
    );
  }
  return navigator.locks.request(COMMERCE_BROWSER_LOCK, task);
}
