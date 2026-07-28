'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  ACTIVE_CHECKOUT_CHANGED_EVENT,
  ACTIVE_CHECKOUT_KEY,
  CART_STORAGE_KEY,
  checkoutAttemptMatchesCurrentCart,
  createStoredCartRequestKey,
  notifyActiveCheckoutChanged,
  readApiJson,
  readStoredCheckout,
  withCommerceBrowserLock,
  writeStoredCheckout,
  type ActiveCheckout,
  type CheckoutClientState as CheckoutState,
} from '@/lib/checkout-client';

function createCheckoutWindow() {
  const checkoutWindow = window.open('', '_blank');
  if (!checkoutWindow) return null;
  try {
    checkoutWindow.opener = null;
    checkoutWindow.document.title = 'Opening secure Checkout';
    checkoutWindow.document.body.textContent = 'Opening secure Stripe Checkout…';
  } catch {
    // The placeholder is optional; navigation still works if a browser blocks
    // access to its initial about:blank document.
  }
  return checkoutWindow;
}

function navigateCheckoutWindow(checkoutWindow: Window, url: string) {
  if (checkoutWindow.closed) return false;
  try {
    checkoutWindow.location.replace(url);
    checkoutWindow.focus();
    return true;
  } catch {
    return false;
  }
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
  const [checkoutStatusRefresh, setCheckoutStatusRefresh] = useState(0);
  const [cartMutationLoading, setCartMutationLoading] = useState(false);
  const cartMutationRunning = useRef(false);
  const checkoutLaunchRunning = useRef(false);
  const checkoutWindowRef = useRef<Window | null>(null);

  const requestItems = useMemo(
    () => cartItems.map(item => ({
      productId: item.id,
      variant: item.size,
      quantity: item.quantity,
    })),
    [cartItems],
  );
  const requestKey = JSON.stringify(requestItems);
  const cartControlsLocked = Boolean(
    isSubmitting
    || cartMutationLoading
    || (activeCheckout && !activeCheckout.token),
  );

  const storeActiveCheckout = (value: ActiveCheckout | null) => {
    setActiveCheckout(value);
    writeStoredCheckout(localStorage, value);
    notifyActiveCheckoutChanged();
  };

  useEffect(() => {
    const restore = (event?: Event) => {
      if (
        event instanceof StorageEvent
        && event.key !== ACTIVE_CHECKOUT_KEY
      ) {
        return;
      }
      try {
        setActiveCheckout(readStoredCheckout(localStorage));
      } catch {
        setActiveCheckout(null);
        setCheckoutError(
          'Checkout recovery data is invalid. Reload before editing so an active payment is not left behind.',
        );
      }
    };
    restore();
    window.addEventListener('storage', restore);
    window.addEventListener(ACTIVE_CHECKOUT_CHANGED_EVENT, restore);
    return () => {
      window.removeEventListener('storage', restore);
      window.removeEventListener(ACTIVE_CHECKOUT_CHANGED_EVENT, restore);
    };
  }, []);

  useEffect(() => {
    if (!activeCheckout?.token) return undefined;
    const refreshOnFocus = () => setCheckoutStatusRefresh(value => value + 1);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshOnFocus();
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [activeCheckout?.token]);

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
        const data = await readApiJson<{ error?: string } & CheckoutState>(response);
        const latestCheckout = readStoredCheckout(localStorage);
        if (latestCheckout?.id !== activeCheckout.id) return;
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
        try {
          const latestCheckout = readStoredCheckout(localStorage);
          if (latestCheckout?.id !== activeCheckout.id) return;
        } catch {
          return;
        }
        setCheckoutError(
          error instanceof Error ? error.message : 'Unable to retrieve checkout status.',
        );
      })
      .finally(() => setCheckoutStateLoading(false));
    return () => controller.abort();
    // The token and attempt ID fully identify the active Checkout Session.
  }, [activeCheckout?.id, activeCheckout?.token, checkoutStatusRefresh, clearCart]);

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
        const data = await readApiJson<{ error?: string } & CheckoutState>(response);
        const latestCheckout = readStoredCheckout(localStorage);
        if (latestCheckout?.id !== checkoutAttemptId) return;
        if (!response.ok) throw new Error(data.error || 'Unable to cancel checkout.');
        const state = data as CheckoutState;
        setCheckoutState(state);
        if (state.reservationStatus === 'released') {
          storeActiveCheckout(null);
          setQuoteRefresh(value => value + 1);
        }
      })
      .catch(error => {
        try {
          const latestCheckout = readStoredCheckout(localStorage);
          if (latestCheckout?.id !== checkoutAttemptId) return;
        } catch {
          return;
        }
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
        const data = await readApiJson<{ error?: string } & CartQuote>(response);
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

  const openCheckoutInNewTab = (url: string) => {
    const checkoutWindow = createCheckoutWindow();
    if (!checkoutWindow) {
      setCheckoutError('Allow pop-ups for this site, then open Checkout again.');
      return false;
    }
    checkoutWindowRef.current = checkoutWindow;
    if (!navigateCheckoutWindow(checkoutWindow, url)) {
      checkoutWindow.close();
      setCheckoutError('The Checkout tab could not be opened. Please try again.');
      return false;
    }
    return true;
  };

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
      const data = await readApiJson<{ error?: string } & CheckoutState>(response);
      const latestCheckout = readStoredCheckout(localStorage);
      const stillCurrent = latestCheckout?.id === activeCheckout.id;
      if (data.orderId && stillCurrent) setCheckoutState(data as CheckoutState);
      if (!response.ok) throw new Error(data.error || 'Unable to cancel checkout.');
      if (!stillCurrent) return;
      const state = data as CheckoutState;
      if (state.reservationStatus === 'released') {
        if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
          checkoutWindowRef.current.close();
        }
        storeActiveCheckout(null);
        setQuoteRefresh(value => value + 1);
      } else if (
        state.paymentStatus === 'paid'
        || state.paymentStatus === 'refunded'
        || state.reservationStatus === 'committed'
      ) {
        storeActiveCheckout(null);
        clearCart();
      }
    } catch (error) {
      setCheckoutError(
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
    checkoutWindow: Window,
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
      const data = await readApiJson<{
        error?: string;
        orderId?: string;
        sessionId?: string;
        url?: string;
        reservationExpiresAt?: string;
        managementToken?: string;
        attemptTerminal?: boolean;
      }>(response);
      if (!response.ok) {
        if (data.attemptTerminal) storeActiveCheckout(null);
        throw new Error(data.error || 'Unable to start checkout.');
      }
      if (!data.url || !data.managementToken || !data.reservationExpiresAt) {
        throw new Error('Stripe did not return a complete Checkout Session.');
      }
      const latestCheckout = readStoredCheckout(localStorage);
      const latestCartKey = createStoredCartRequestKey(
        localStorage.getItem(CART_STORAGE_KEY),
      );
      if (!checkoutAttemptMatchesCurrentCart(latestCheckout, latestCartKey, attempt)) {
        let cancellationResponse: Response;
        let cancellationState: Partial<CheckoutState> & { error?: string };
        try {
          cancellationResponse = await fetch('/api/checkout/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              checkoutAttemptId: attempt.id,
              token: data.managementToken,
            }),
          });
          cancellationState = await cancellationResponse.json();
        } catch {
          if (latestCheckout?.id === attempt.id) {
            storeActiveCheckout({
              ...attempt,
              token: data.managementToken,
              expiresAt: data.reservationExpiresAt,
            });
          }
          throw new Error(
            'The cart changed while Checkout was opening, but cancellation could not be verified. Use Cancel Checkout before editing or paying.',
          );
        }
        if (
          latestCheckout?.id === attempt.id
          && cancellationState.reservationStatus !== 'released'
        ) {
          storeActiveCheckout({
            ...attempt,
            token: data.managementToken,
            expiresAt: data.reservationExpiresAt,
          });
        } else if (
          latestCheckout?.id === attempt.id
          && cancellationState.reservationStatus === 'released'
        ) {
          storeActiveCheckout(null);
        }
        if (
          !cancellationResponse.ok
          || cancellationState.reservationStatus !== 'released'
        ) {
          throw new Error(
            'The cart changed while Checkout was opening. Stripe has not confirmed cancellation, so this cart remains locked until you cancel the active Session.',
          );
        }
        throw new Error(
          'The cart changed in another tab while Checkout was opening. The stale Session was cancelled.',
        );
      }
      storeActiveCheckout({
        ...attempt,
        token: data.managementToken,
        expiresAt: data.reservationExpiresAt,
      });
      checkoutWindowRef.current = checkoutWindow;
      if (!navigateCheckoutWindow(checkoutWindow, data.url)) {
        throw new Error(
          'Checkout was reserved, but the new tab was closed. Use Resume Checkout to continue.',
        );
      }
    } catch (error) {
      if (!checkoutWindow.closed) checkoutWindow.close();
      setCheckoutError(error instanceof Error ? error.message : 'Unable to start checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (
      checkoutLaunchRunning.current
      || !quote
      || quoteLoading
      || quoteError
    ) return;

    checkoutLaunchRunning.current = true;
    let checkoutWindow: Window | null = null;
    try {
      if (
        activeCheckout?.token
        && activeCheckout.cartKey === requestKey
        && checkoutState?.sessionStatus === 'open'
        && checkoutState.url
      ) {
        openCheckoutInNewTab(checkoutState.url);
        return;
      }
      if (activeCheckout?.token) {
        setCheckoutError('Cancel the active Checkout reservation before starting another one.');
        return;
      }

      const openedCheckoutWindow = createCheckoutWindow();
      checkoutWindow = openedCheckoutWindow;
      if (!openedCheckoutWindow) {
        setCheckoutError('Allow pop-ups for this site, then start Checkout again.');
        return;
      }

      const startOrRecover = async () => {
        try {
          if (
            createStoredCartRequestKey(localStorage.getItem(CART_STORAGE_KEY))
            !== requestKey
          ) {
            openedCheckoutWindow.close();
            setCheckoutError(
              'The cart changed in another tab. Its latest contents are loading; review them before Checkout.',
            );
            return;
          }
        } catch {
          openedCheckoutWindow.close();
          setCheckoutError('The stored cart is invalid. Reload it before starting Checkout.');
          return;
        }
        let storedCheckout: ActiveCheckout | null = null;
        try {
          storedCheckout = readStoredCheckout(localStorage);
        } catch {
          openedCheckoutWindow.close();
          setCheckoutError(
            'Checkout recovery data is invalid. Reload before starting another payment.',
          );
          return;
        }
        const existingAttempt = storedCheckout || activeCheckout;
        if (existingAttempt?.token) {
          setActiveCheckout(existingAttempt);
          openedCheckoutWindow.close();
          setCheckoutError('Another tab already started Checkout. Resume or cancel that Session.');
          return;
        }
        if (existingAttempt && existingAttempt.cartKey !== requestKey) {
          openedCheckoutWindow.close();
          setActiveCheckout(existingAttempt);
          setCheckoutError(
            'Another tab is recovering Checkout for a different cart. Recover or cancel it first.',
          );
          return;
        }

        const attempt = existingAttempt || {
          id: crypto.randomUUID(),
          cartKey: requestKey,
          quote,
        };
        if (!existingAttempt) storeActiveCheckout(attempt);

        await submitCheckoutAttempt(attempt, requestItems, openedCheckoutWindow);
      };

      await withCommerceBrowserLock(startOrRecover);
    } catch (error) {
      if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.close();
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Checkout could not be coordinated safely. Please try again.',
      );
    } finally {
      checkoutLaunchRunning.current = false;
    }
  };

  const handleCartMutation = async (
    mutation: () => ReturnType<typeof updateQuantity>,
  ) => {
    if (cartMutationRunning.current) return;
    cartMutationRunning.current = true;
    setCartMutationLoading(true);
    setQuoteError('');
    setCheckoutError('');
    try {
      const result = await mutation();
      if (!result.applied) {
        setCheckoutError(result.message || 'The cart could not be updated safely.');
        return;
      }
      if (result.cancelledCheckout) {
        if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
          checkoutWindowRef.current.close();
        }
        setCheckoutState(null);
        setQuoteRefresh(value => value + 1);
      }
    } catch {
      setCheckoutError(
        'The cart update could not be coordinated across tabs. Nothing was changed.',
      );
    } finally {
      cartMutationRunning.current = false;
      setCartMutationLoading(false);
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
                      Stripe Checkout is open in a separate tab. Editing this cart safely
                      cancels that Session first, then refreshes price and availability.
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
                    onClick={() => checkoutState?.url && openCheckoutInNewTab(checkoutState.url)}
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
                        onClick={() => handleCartMutation(
                          () => removeFromCart(item.id, item.size),
                        )}
                        disabled={cartControlsLocked}
                        aria-label="Remove item"
                        className="text-warm-black/35 hover:text-pink disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-5">
                      <div className="flex items-center bg-plum/5 border border-plum/10 rounded-xl overflow-hidden">
                        <button
                          onClick={() => handleCartMutation(
                            () => updateQuantity(item.id, item.size, item.quantity - 1),
                          )}
                          disabled={cartControlsLocked}
                          className="px-3 py-1.5 font-black text-plum disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-xs font-bold text-plum">{item.quantity}</span>
                        <button
                          onClick={() => handleCartMutation(
                            () => updateQuantity(item.id, item.size, item.quantity + 1),
                          )}
                          disabled={cartControlsLocked || item.quantity >= maxQuantity}
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
                  : isSubmitting
                    ? 'Opening Stripe Checkout'
                    : 'Open Stripe Checkout'}
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
