'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StoreProduct } from '@/lib/types';
import {
  ACTIVE_CHECKOUT_KEY,
  CART_STORAGE_KEY,
  canMutateCartAfterCheckout,
  notifyActiveCheckoutChanged,
  parseStoredCheckout,
  withCommerceBrowserLock,
  writeStoredCheckout,
  type CheckoutClientState,
} from '@/lib/checkout-client';

export interface CartItem {
  id: number;
  product_title: string;
  slug: string;
  price: string;
  price_cents: number;
  image: string;
  quantity: number;
  size: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (
    product: StoreProduct,
    size: string,
    quantity: number,
  ) => Promise<CartMutationResult>;
  removeFromCart: (id: number, size: string) => Promise<CartMutationResult>;
  updateQuantity: (id: number, size: string, quantity: number) => Promise<CartMutationResult>;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

export interface CartMutationResult {
  applied: boolean;
  cancelledCheckout: boolean;
  message?: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return (
    Number.isInteger(item.id)
    && typeof item.product_title === 'string'
    && typeof item.slug === 'string'
    && typeof item.price === 'string'
    && Number.isInteger(item.price_cents)
    && typeof item.image === 'string'
    && Number.isInteger(item.quantity)
    && Number(item.quantity) > 0
    && typeof item.size === 'string'
  );
}

function readStoredCart(): CartItem[] {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return [];
  const parsed = JSON.parse(stored) as unknown;
  if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
    throw new Error('The stored cart is invalid.');
  }
  return parsed;
}

function discardInvalidStoredCart() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to discard invalid cart from localStorage', error);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let restoredItems: CartItem[] = [];
    try {
      restoredItems = readStoredCart();
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
      discardInvalidStoredCart();
    }
    queueMicrotask(() => {
      setCartItems(restoredItems);
      setIsInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (!isInitialized) return undefined;
    const synchronizeCart = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      try {
        setCartItems(readStoredCart());
      } catch (e) {
        console.error('Failed to synchronize cart from another tab', e);
        discardInvalidStoredCart();
        setCartItems([]);
      }
    };
    window.addEventListener('storage', synchronizeCart);
    return () => window.removeEventListener('storage', synchronizeCart);
  }, [isInitialized]);

  const replaceCart = useCallback((items: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    setCartItems(items);
  }, []);

  const releaseCheckoutBeforeMutation = useCallback(async (): Promise<CartMutationResult> => {
    const rawCheckout = localStorage.getItem(ACTIVE_CHECKOUT_KEY);
    if (!rawCheckout) return { applied: true, cancelledCheckout: false };

    let activeCheckout;
    try {
      activeCheckout = parseStoredCheckout(rawCheckout);
    } catch {
      return {
        applied: false,
        cancelledCheckout: false,
        message:
          'Checkout recovery data is invalid. Reload the cart before editing so an active payment is not left behind.',
      };
    }
    if (!activeCheckout) return { applied: true, cancelledCheckout: false };
    if (!activeCheckout.token) {
      return {
        applied: false,
        cancelledCheckout: false,
        message:
          'Checkout is still being created or recovered. Finish recovery before changing the cart.',
      };
    }

    try {
      const response = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutAttemptId: activeCheckout.id,
          token: activeCheckout.token,
        }),
      });
      const data = await response.json() as Partial<CheckoutClientState> & { error?: string };
      if (
        data.paymentStatus === 'paid'
        || data.paymentStatus === 'refunded'
        || data.reservationStatus === 'committed'
      ) {
        writeStoredCheckout(localStorage, null);
        notifyActiveCheckoutChanged();
        replaceCart([]);
        return {
          applied: false,
          cancelledCheckout: false,
          message:
            'Payment completed before the cart could be changed. The paid order was kept and the cart was cleared.',
        };
      }
      if (!response.ok || !data.orderId) {
        return {
          applied: false,
          cancelledCheckout: false,
          message:
            data.error
            || 'Stripe could not confirm cancellation. The cart was not changed and inventory remains reserved.',
        };
      }
      if (!canMutateCartAfterCheckout(data as CheckoutClientState)) {
        return {
          applied: false,
          cancelledCheckout: false,
          message:
            data.paymentStatus === 'processing'
              ? 'Payment is processing, so this cart cannot be changed or submitted again.'
              : 'Stripe has not confirmed that this Checkout Session can no longer accept payment.',
        };
      }

      const latestRaw = localStorage.getItem(ACTIVE_CHECKOUT_KEY);
      if (latestRaw) {
        const latestCheckout = parseStoredCheckout(latestRaw);
        if (latestCheckout?.id !== activeCheckout.id) {
          return {
            applied: false,
            cancelledCheckout: false,
            message: 'Another tab started a different Checkout Session. The cart was not changed.',
          };
        }
      }
      writeStoredCheckout(localStorage, null);
      notifyActiveCheckoutChanged();
      return { applied: true, cancelledCheckout: true };
    } catch {
      return {
        applied: false,
        cancelledCheckout: false,
        message:
          'Checkout cancellation could not be verified. The cart was not changed and inventory remains reserved.',
      };
    }
  }, [replaceCart]);

  const mutateCart = useCallback(async (
    mutation: (items: CartItem[]) => CartItem[],
  ): Promise<CartMutationResult> => withCommerceBrowserLock(async () => {
    const checkoutRelease = await releaseCheckoutBeforeMutation();
    if (!checkoutRelease.applied) return checkoutRelease;

    try {
      const latestItems = readStoredCart();
      const nextItems = mutation(latestItems);
      replaceCart(nextItems);
      return {
        applied: true,
        cancelledCheckout: checkoutRelease.cancelledCheckout,
      };
    } catch {
      return {
        applied: false,
        cancelledCheckout: checkoutRelease.cancelledCheckout,
        message: 'The cart could not be updated safely. Reload it and try again.',
      };
    }
  }), [releaseCheckoutBeforeMutation, replaceCart]);

  const addToCart = useCallback((
    product: StoreProduct,
    size: string,
    quantity: number,
  ) => mutateCart((items) => {
    const existingIndex = items.findIndex(
      item => item.id === product.id && item.size === size,
    );
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
      return updated;
    }
    return [
      ...items,
      {
        id: product.id,
        product_title: product.product_title,
        slug: product.slug,
        price: product.price,
        price_cents: product.price_cents,
        image: product.image,
        quantity,
        size,
      },
    ];
  }), [mutateCart]);

  const removeFromCart = useCallback((id: number, size: string) => mutateCart(
    items => items.filter(item => !(item.id === id && item.size === size)),
  ), [mutateCart]);

  const updateQuantity = useCallback((
    id: number,
    size: string,
    quantity: number,
  ) => mutateCart((items) => (
    quantity <= 0
      ? items.filter(item => !(item.id === id && item.size === size))
      : items.map(item => (
        item.id === id && item.size === size
          ? { ...item, quantity }
          : item
      ))
  )), [mutateCart]);

  const clearCart = useCallback(() => {
    replaceCart([]);
  }, [replaceCart]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + item.price_cents / 100 * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
