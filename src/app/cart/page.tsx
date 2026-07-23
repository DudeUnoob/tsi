'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Loader2, Lock, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartQuote, formatMoney } from '@/lib/commerce';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutAttempt, setCheckoutAttempt] = useState<{ cartKey: string; id: string } | null>(null);

  const requestItems = useMemo(
    () => cartItems.map(item => ({
      productId: item.id,
      variant: item.size,
      quantity: item.quantity,
    })),
    [cartItems],
  );
  const requestKey = JSON.stringify(requestItems);

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
  }, [requestKey]);

  const handleCheckout = async () => {
    if (!quote || quoteLoading || quoteError) return;
    setIsSubmitting(true);
    const attemptId = checkoutAttempt?.cartKey === requestKey
      ? checkoutAttempt.id
      : crypto.randomUUID();
    setCheckoutAttempt({ cartKey: requestKey, id: attemptId });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutAttemptId: attemptId,
          items: requestItems,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to start checkout.');
      if (!data.url) throw new Error('Stripe did not return a Checkout URL.');
      window.location.assign(data.url);
    } catch (error) {
      setIsSubmitting(false);
      setQuoteError(error instanceof Error ? error.message : 'Unable to start checkout.');
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
                      <button onClick={() => removeFromCart(item.id, item.size)} aria-label="Remove item" className="text-warm-black/35 hover:text-pink">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-5">
                      <div className="flex items-center bg-plum/5 border border-plum/10 rounded-xl overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)} className="px-3 py-1.5 font-black text-plum">−</button>
                        <span className="w-9 text-center text-xs font-bold text-plum">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          disabled={item.quantity >= maxQuantity}
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

            <button
              type="button"
              onClick={handleCheckout}
              disabled={!quote || quoteLoading || Boolean(quoteError) || isSubmitting}
              className="w-full py-4 bg-plum text-linen font-black uppercase text-xs tracking-widest rounded-2xl shadow disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" /> Continue to Stripe
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
