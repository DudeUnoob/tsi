'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartQuote, formatMoney } from '@/lib/commerce';

const ACTIVE_CHECKOUT_KEY = 'sanga_active_checkout';

type ActiveCheckout = {
  id: string;
  cartKey: string;
  token?: string;
  expiresAt?: string;
  quote: CartQuote;
};

type CheckoutState = {
  orderId: string;
  sessionId: string | null;
  sessionStatus: 'open' | 'complete' | 'expired' | null;
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  reservationStatus: 'reserved' | 'committed' | 'released';
  expiresAt: string;
  url: string | null;
  inventoryException: boolean;
};

function readStoredCheckout(): ActiveCheckout | null {
  const stored = localStorage.getItem(ACTIVE_CHECKOUT_KEY);
  if (!stored) return null;
  const value = JSON.parse(stored) as Partial<ActiveCheckout>;
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

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckout | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);
  const [checkoutStateLoading, setCheckoutStateLoading] = useState(false);
  const [quoteRefresh, setQuoteRefresh] = useState(0);

  const requestItems = useMemo(
    () => cartItems.map(item => ({
      productId: item.id,
      variant: item.size,
      quantity: item.quantity,
    })),
    [cartItems],
  );
  const requestKey = JSON.stringify(requestItems);
  const checkoutLocked = Boolean(
    activeCheckout
    && (
      checkoutStateLoading
      || !checkoutState
      || (
        checkoutState.reservationStatus === 'reserved'
        && checkoutState.sessionStatus === 'open'
      )
    ),
  );

  const storeActiveCheckout = (value: ActiveCheckout | null) => {
    setActiveCheckout(value);
    if (value) localStorage.setItem(ACTIVE_CHECKOUT_KEY, JSON.stringify(value));
    else localStorage.removeItem(ACTIVE_CHECKOUT_KEY);
  };

  useEffect(() => {
    const restore = () => {
      try {
        setActiveCheckout(readStoredCheckout());
      } catch {
        localStorage.removeItem(ACTIVE_CHECKOUT_KEY);
        setActiveCheckout(null);
      }
    };
    restore();
    window.addEventListener('storage', restore);
    return () => window.removeEventListener('storage', restore);
  }, []);

  useEffect(() => {
    if (!activeCheckout?.token) {
      queueMicrotask(() => setCheckoutState(null));
      return undefined;
    }
    if (new URLSearchParams(window.location.search).has('cancel_attempt')) {
      return undefined;
    }
    const controller = new AbortController();
    queueMicrotask(() => setCheckoutStateLoading(true));
    fetch('/api/checkout/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkoutAttemptId: activeCheckout.id,
        token: activeCheckout.token,
      }),
      signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to retrieve checkout status.');
        const state = data as CheckoutState;
        setCheckoutState(state);
        if (state.paymentStatus === 'paid' || state.paymentStatus === 'processing') {
          storeActiveCheckout(null);
          clearCart();
        } else if (
          state.reservationStatus !== 'reserved'
          || state.sessionStatus === 'expired'
          || state.paymentStatus === 'refunded'
        ) {
          storeActiveCheckout(null);
          setQuoteRefresh(value => value + 1);
        }
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setQuoteError(error instanceof Error ? error.message : 'Unable to retrieve checkout status.');
      })
      .finally(() => setCheckoutStateLoading(false));
    return () => controller.abort();
    // The token and attempt ID fully identify the active Checkout Session.
  }, [activeCheckout?.id, activeCheckout?.token, clearCart]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutAttemptId = params.get('cancel_attempt');
    const token = params.get('cancel_token');
    if (!checkoutAttemptId || !token) return;

    window.history.replaceState({}, '', '/cart');
    queueMicrotask(() => setCheckoutStateLoading(true));
    fetch('/api/checkout/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutAttemptId, token }),
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to cancel checkout.');
        const state = data as CheckoutState;
        setCheckoutState(state);
        if (state.reservationStatus === 'released') {
          storeActiveCheckout(null);
          setQuoteRefresh(value => value + 1);
        }
      })
      .catch(error => {
        setQuoteError(
          error instanceof Error
            ? error.message
            : 'Unable to cancel Checkout safely. The reservation remains active.',
        );
      })
      .finally(() => setCheckoutStateLoading(false));
    // Stripe's return URL is consumed exactly once.
  }, []);

  useEffect(() => {
    let active = true;
    if (requestItems.length === 0) {
      queueMicrotask(() => {
        if (!active) return;
        setQuote(null);
        setQuoteError('');
      });
      return () => {
        active = false;
      };
    }
    if (activeCheckout?.cartKey === requestKey && activeCheckout.quote) {
      queueMicrotask(() => {
        if (!active) return;
        setQuote(activeCheckout.quote);
        setQuoteError('');
        setQuoteLoading(false);
      });
      return () => {
        active = false;
      };
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!active) return;
      setQuoteLoading(true);
      setQuoteError('');
    });
    fetch('/api/store/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: requestItems }),
      signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to refresh the cart.');
        setQuote(data as CartQuote);
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setQuote(null);
        setQuoteError(error instanceof Error ? error.message : 'Unable to refresh the cart.');
      })
      .finally(() => setQuoteLoading(false));

    return () => {
      active = false;
      controller.abort();
    };
    // requestKey represents the complete authoritative cart request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, quoteRefresh, activeCheckout]);

  const handleCancelCheckout = async () => {
    if (!activeCheckout?.token) return;
    setCheckoutStateLoading(true);
    setQuoteError('');
    setCheckoutError('');
    try {
      const response = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutAttemptId: activeCheckout.id,
          token: activeCheckout.token,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to cancel checkout.');
      const state = data as CheckoutState;
      setCheckoutState(state);
      if (state.reservationStatus === 'released') {
        storeActiveCheckout(null);
        setQuoteRefresh(value => value + 1);
      }
    } catch (error) {
      setQuoteError(
        error instanceof Error
          ? error.message
          : 'Unable to cancel Checkout safely. The reservation remains active.',
      );
    } finally {
      setCheckoutStateLoading(false);
    }
  };

  const submitCheckoutAttempt = async (
    attempt: ActiveCheckout,
    items: Array<{ productId: number; variant: string; quantity: number }>,
    navigateToStripe: boolean,
  ) => {
    setIsSubmitting(true);
    setCheckoutError('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutAttemptId: attempt.id,
          items,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.attemptTerminal) storeActiveCheckout(null);
        throw new Error(data.error || 'Unable to start checkout.');
      }
      if (!data.url || !data.managementToken || !data.reservationExpiresAt) {
        throw new Error('Stripe did not return a complete Checkout Session.');
      }
      storeActiveCheckout({
        ...attempt,
        token: data.managementToken,
        expiresAt: data.reservationExpiresAt,
      });
      if (navigateToStripe) {
        window.location.assign(data.url);
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      setCheckoutError(error instanceof Error ? error.message : 'Unable to start checkout.');
    }
  };

  const handleCheckout = async () => {
    if (!quote || quoteLoading || quoteError) return;
    if (
      activeCheckout?.token
      && activeCheckout.cartKey === requestKey
      && checkoutState?.sessionStatus === 'open'
      && checkoutState.url
    ) {
      window.location.assign(checkoutState.url);
      return;
    }
    if (activeCheckout?.token) {
      setCheckoutError('Cancel the active Checkout reservation before starting another one.');
      return;
    }

    const startOrRecover = async () => {
      let storedCheckout: ActiveCheckout | null = null;
      try {
        storedCheckout = readStoredCheckout();
      } catch {
        localStorage.removeItem(ACTIVE_CHECKOUT_KEY);
      }
      const existingAttempt = storedCheckout || activeCheckout;
      if (existingAttempt?.token) {
        setActiveCheckout(existingAttempt);
        setCheckoutError('Another tab already started Checkout. Resume or cancel that Session.');
        return;
      }

      const attempt = existingAttempt || {
        id: crypto.randomUUID(),
        cartKey: requestKey,
        quote,
      };
      if (!existingAttempt) storeActiveCheckout(attempt);

      const sameCart = attempt.cartKey === requestKey;
      const attemptItems = sameCart
        ? requestItems
        : attempt.quote.items.map(item => ({
            productId: item.product_id,
            variant: item.variant,
            quantity: item.quantity,
          }));
      await submitCheckoutAttempt(attempt, attemptItems, sameCart);
    };

    if (navigator.locks) {
      await navigator.locks.request('sanga-checkout-start', startOrRecover);
    } else {
      await startOrRecover();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-linen min-h-screen py-24 font-sans text-warm-black flex items-center">
        <div className="max-w-xl mx-auto px-6 text-center space-y-6">
          <div className="w-20 h-20 bg-plum/5 border border-plum/10 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="h-8 w-8 text-plum/40" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-black text-plum">Your Cart is Empty</h1>
            <p className="text-sm text-warm-black/60 mt-2">Explore official Sanga merchandise to get started.</p>
          </div>
          <Link href="/store" className="inline-flex items-center gap-2 px-6 py-3 bg-plum text-linen font-black text-xs uppercase tracking-widest rounded-full">
            Explore Store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linen min-h-screen py-16 font-sans text-warm-black">
      {isSubmitting && (
        <div className="fixed inset-0 bg-plum/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-linen">
          <Loader2 className="h-12 w-12 text-sunshine animate-spin" />
          <h2 className="font-display text-2xl font-black text-sunshine mt-5">Opening Secure Checkout</h2>
          <p className="text-sm text-linen/75 mt-2">Your merchandise is reserved for 30 minutes.</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6">
        <div className="border-b border-plum/10 pb-8 mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-plum">Shopping Cart</h1>
          <p className="text-sm text-warm-black/60 mt-2">
            Prices and stock are verified live before Stripe Checkout.
          </p>
        </div>

        {activeCheckout && (
          <div className="mb-8 rounded-2xl border border-sunshine/40 bg-sunshine/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-black text-plum">
                {activeCheckout.token
                  ? 'Merchandise temporarily reserved'
                  : 'Checkout start needs recovery'}
              </h2>
              <p className="text-xs text-warm-black/65 mt-1">
                {activeCheckout.token && activeCheckout.expiresAt
                  ? (
                    <>
                      Resume the existing Stripe Checkout or cancel it before editing this cart.
                      The hold expires at {new Date(activeCheckout.expiresAt).toLocaleTimeString()}.
                    </>
                  )
                  : 'Retry the same attempt so the server can recover any Session created before the connection was interrupted.'}
              </p>
            </div>
            <div className="flex gap-2">
              {activeCheckout.token ? (
                <>
                  <button
                    type="button"
                    disabled={checkoutStateLoading || !checkoutState?.url}
                    onClick={() => checkoutState?.url && window.location.assign(checkoutState.url)}
                    className="px-4 py-2.5 rounded-xl bg-plum text-linen text-xs font-black uppercase tracking-wider disabled:opacity-40 flex items-center gap-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Resume
                  </button>
                  <button
                    type="button"
                    disabled={checkoutStateLoading}
                    onClick={handleCancelCheckout}
                    className="px-4 py-2.5 rounded-xl border border-pink/30 text-pink text-xs font-black uppercase tracking-wider disabled:opacity-40 flex items-center gap-2"
                  >
                    {checkoutStateLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <X className="h-3.5 w-3.5" />}
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCheckout}
                  className="px-4 py-2.5 rounded-xl bg-plum text-linen text-xs font-black uppercase tracking-wider disabled:opacity-40 flex items-center gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Recover
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-4">
            {cartItems.map(item => {
              const authoritative = quote?.items.find(
                line => line.product_id === item.id && line.variant === item.size.toUpperCase(),
              );
              const maxQuantity = authoritative?.available ?? item.quantity;
              return (
                <div key={`${item.id}-${item.size}`} className="flex gap-4 p-5 bg-linen rounded-2xl border border-plum/10 shadow-sm">
                  <div className="relative w-24 h-24 bg-plum/5 rounded-xl overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.product_title} fill className="object-cover" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-plum/20 absolute inset-0 m-auto" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between gap-4">
                      <div>
                        <Link href={`/store/${item.slug}`} className="font-display text-lg font-bold text-plum">
                          {authoritative?.title || item.product_title}
                        </Link>
                        <p className="text-xs text-warm-black/60 mt-1">Variant: {item.size}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        disabled={checkoutLocked}
                        aria-label="Remove item"
                        className="text-warm-black/35 hover:text-pink disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-5">
                      <div className="flex items-center bg-plum/5 border border-plum/10 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          disabled={checkoutLocked}
                          className="px-3 py-1.5 font-black text-plum disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-xs font-bold text-plum">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          disabled={checkoutLocked || item.quantity >= maxQuantity}
                          className="px-3 py-1.5 font-black text-plum disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-display font-black text-plum">
                        {authoritative
                          ? formatMoney(authoritative.line_total)
                          : 'Refreshing…'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="lg:col-span-5 bg-linen rounded-3xl border border-plum/10 p-7 shadow-sm space-y-5">
            <h2 className="font-display text-2xl font-black text-plum">Order Summary</h2>
            {quoteLoading ? (
              <div className="flex items-center gap-2 text-sm text-plum/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Refreshing price and stock…
              </div>
            ) : quote ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(quote.subtotal_cents)}</strong></div>
                <div className="flex justify-between"><span>US shipping</span><strong>{formatMoney(quote.shipping_cents)}</strong></div>
                <div className="flex justify-between pt-3 border-t border-plum/10 text-lg font-display font-black text-plum">
                  <span>Total</span><span>{formatMoney(quote.total_cents)}</span>
                </div>
              </div>
            ) : null}

            {quoteError && (
              <div className="rounded-xl border border-pink/30 bg-pink/5 p-3 text-xs font-bold text-pink">
                {quoteError}
              </div>
            )}
            {checkoutError && (
              <div className="rounded-xl border border-pink/30 bg-pink/5 p-3 text-xs font-bold text-pink">
                {checkoutError}
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={
                !quote
                || quoteLoading
                || Boolean(quoteError)
                || isSubmitting
                || Boolean(activeCheckout?.token && !checkoutState?.url)
              }
              className="w-full py-4 bg-plum text-linen font-black uppercase text-xs tracking-widest rounded-2xl shadow disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              {activeCheckout?.token
                ? 'Resume Stripe Checkout'
                : activeCheckout
                  ? 'Recover Stripe Checkout'
                  : 'Continue to Stripe'}
            </button>

            <div className="flex gap-2 text-[11px] text-warm-black/60 border-t border-plum/10 pt-4">
              <ShieldCheck className="h-4 w-4 text-pink flex-shrink-0" />
              Stripe securely collects payment, email, and the US shipping address.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
