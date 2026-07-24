import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canMutateCartAfterCheckout,
  checkoutAttemptMatchesCurrentCart,
  createStoredCartRequestKey,
  parseStoredCheckout,
  shouldClearCartAfterCheckout,
  withCommerceBrowserLock,
  type CheckoutClientState,
} from '@/lib/checkout-client';

function state(
  overrides: Partial<CheckoutClientState> = {},
): CheckoutClientState {
  return {
    orderId: 'f179d8f4-a422-4f23-bc97-2d3a281743d8',
    sessionId: 'cs_test_checkout',
    sessionStatus: 'expired',
    paymentStatus: 'failed',
    reservationStatus: 'released',
    expiresAt: '2030-01-01T00:00:00.000Z',
    url: null,
    inventoryException: false,
    ...overrides,
  };
}

describe('checkout client coordination', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a complete stored checkout attempt', () => {
    const parsed = parseStoredCheckout(JSON.stringify({
      id: 'f179d8f4-a422-4f23-bc97-2d3a281743d8',
      cartKey: 'cart-fingerprint',
      token: 'signed-management-token',
      expiresAt: '2030-01-01T00:00:00.000Z',
      quote: {
        items: [],
        subtotal_cents: 0,
        shipping_cents: 500,
        total_cents: 500,
        currency: 'usd',
      },
    }));
    expect(parsed?.token).toBe('signed-management-token');
  });

  it('rejects corrupt checkout recovery state instead of silently discarding it', () => {
    expect(() => parseStoredCheckout(JSON.stringify({
      id: 'attempt-without-cart-state',
    }))).toThrow('Invalid stored checkout attempt.');
  });

  it('allows cart mutation only after Stripe is terminal and inventory is released', () => {
    expect(canMutateCartAfterCheckout(state())).toBe(true);
    expect(canMutateCartAfterCheckout(state({
      sessionStatus: 'open',
      paymentStatus: 'pending',
      reservationStatus: 'reserved',
    }))).toBe(false);
    expect(canMutateCartAfterCheckout(state({
      sessionStatus: 'complete',
      paymentStatus: 'processing',
      reservationStatus: 'reserved',
    }))).toBe(false);
    expect(canMutateCartAfterCheckout(state({
      sessionStatus: 'complete',
      paymentStatus: 'paid',
      reservationStatus: 'committed',
    }))).toBe(false);
    expect(canMutateCartAfterCheckout(state({
      sessionStatus: 'complete',
      paymentStatus: 'paid',
      reservationStatus: 'released',
      inventoryException: true,
    }))).toBe(false);
  });

  it('derives the checkout request from the latest cross-tab cart state', () => {
    expect(createStoredCartRequestKey(JSON.stringify([
      { id: 1, size: 'M', quantity: 2, product_title: 'Hoodie' },
    ]))).toBe(JSON.stringify([
      { productId: 1, variant: 'M', quantity: 2 },
    ]));
    expect(() => createStoredCartRequestKey(JSON.stringify([
      { id: 1, size: 'M', quantity: 0 },
    ]))).toThrow('Invalid stored cart.');
  });

  it('does not let a delayed success tab clear a newer cart attempt', () => {
    const activeCheckout = parseStoredCheckout(JSON.stringify({
      id: 'newer-order',
      cartKey: 'newer-cart',
      quote: {
        items: [],
        subtotal_cents: 0,
        shipping_cents: 500,
        total_cents: 500,
        currency: 'usd',
      },
    }));
    expect(shouldClearCartAfterCheckout(activeCheckout, 'older-order')).toBe(false);
    expect(shouldClearCartAfterCheckout(activeCheckout, 'newer-order')).toBe(true);
    expect(shouldClearCartAfterCheckout(null, 'older-order')).toBe(false);
  });

  it('invalidates a Checkout response when either the attempt or cart changed', () => {
    const activeCheckout = parseStoredCheckout(JSON.stringify({
      id: 'attempt-one',
      cartKey: 'cart-one',
      quote: {
        items: [],
        subtotal_cents: 0,
        shipping_cents: 500,
        total_cents: 500,
        currency: 'usd',
      },
    }));
    const attempt = { id: 'attempt-one', cartKey: 'cart-one' };
    expect(checkoutAttemptMatchesCurrentCart(activeCheckout, 'cart-one', attempt)).toBe(true);
    expect(checkoutAttemptMatchesCurrentCart(activeCheckout, 'cart-two', attempt)).toBe(false);
    expect(checkoutAttemptMatchesCurrentCart(
      { ...activeCheckout!, id: 'attempt-two' },
      'cart-one',
      attempt,
    )).toBe(false);
  });

  it('uses the browser lock to serialize commerce work', async () => {
    const request = vi.fn(async (
      _name: string,
      task: () => Promise<string>,
    ) => task());
    vi.stubGlobal('navigator', { locks: { request } });

    await expect(withCommerceBrowserLock(async () => 'complete')).resolves.toBe('complete');
    expect(request).toHaveBeenCalledOnce();
  });

  it('fails closed when the browser cannot coordinate commerce work across tabs', async () => {
    const task = vi.fn(async () => 'unsafe');
    vi.stubGlobal('navigator', {});

    await expect(withCommerceBrowserLock(task)).rejects.toThrow(
      'This browser cannot safely coordinate merchandise checkout across tabs.',
    );
    expect(task).not.toHaveBeenCalled();
  });
});
