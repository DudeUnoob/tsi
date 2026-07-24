'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/commerce';
import {
  notifyActiveCheckoutChanged,
  readStoredCheckout,
  shouldClearCartAfterCheckout,
  writeStoredCheckout,
} from '@/lib/checkout-client';

type SessionSummary = {
  id: string;
  paymentStatus: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  amountTotal?: number;
  currency?: string;
  reservationStatus?: string;
  inventoryException?: boolean;
};

function SuccessContent() {
  const sessionId = useSearchParams().get('session_id') || '';
  const { clearCart } = useCart();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      queueMicrotask(() => setComplete(true));
      return;
    }
    fetch(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to verify payment.');
        setSummary(data);
        if (data.paymentStatus === 'paid' || data.paymentStatus === 'processing') {
          try {
            const activeCheckout = readStoredCheckout(localStorage);
            if (shouldClearCartAfterCheckout(activeCheckout, data.id)) {
              writeStoredCheckout(localStorage, null);
              notifyActiveCheckoutChanged();
              clearCart();
            }
          } catch {
            // Never discard a different or damaged cart from a delayed success
            // page. The server has already synchronized the paid order.
          }
        }
      })
      .catch(error => console.error('Checkout verification failed:', error))
      .finally(() => setComplete(true));
  }, [sessionId, clearCart]);

  const paid = summary?.paymentStatus === 'paid';
  const processing = summary?.paymentStatus === 'processing';
  return (
    <div className="bg-linen min-h-screen flex items-center py-16 text-warm-black">
      <div className="max-w-xl mx-auto px-6 w-full">
        <div className="rounded-3xl border border-plum/10 bg-linen p-8 shadow-sm text-center">
          {!complete ? (
            <Loader2 className="h-12 w-12 animate-spin text-plum mx-auto" />
          ) : (
            <CheckCircle2 className={`h-12 w-12 mx-auto ${paid ? 'text-pink' : 'text-plum/35'}`} />
          )}
          <h1 className="font-display text-3xl font-black text-plum mt-5">
            {!complete
              ? 'Verifying Payment'
              : paid
                ? summary?.inventoryException
                  ? 'Payment Received — Order Review Required'
                  : 'Thank You for Your Order!'
                : processing
                  ? 'Payment Processing'
                  : 'Payment Not Confirmed'}
          </h1>
          <p className="text-sm text-warm-black/65 mt-3">
            {!complete
              ? 'Stripe is confirming your secure Checkout Session.'
              : paid
                ? summary?.inventoryException
                  ? 'Your payment is confirmed. Our team has been alerted to review merchandise availability before fulfillment.'
                  : 'Your payment is confirmed and the order is ready for fulfillment.'
                : processing
                  ? 'Stripe is still processing your payment. Do not place another order; we will update this order when processing finishes.'
                : 'Please contact us before placing another order.'}
          </p>

          {paid && summary && (
            <div className="text-left rounded-2xl bg-plum/5 border border-plum/10 p-5 mt-6 text-sm space-y-2">
              <div className="flex justify-between"><span>Order</span><strong>{summary.id.slice(0, 16)}…</strong></div>
              {summary.customerEmail && <div className="flex justify-between gap-4"><span>Receipt</span><strong className="truncate">{summary.customerEmail}</strong></div>}
              {typeof summary.amountTotal === 'number' && (
                <div className="flex justify-between"><span>Total paid</span><strong>{formatMoney(summary.amountTotal, summary.currency)}</strong></div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-7">
            <Link href="/store" className="flex-1 py-3 bg-plum text-linen rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Store
            </Link>
            <Link href="/" className="flex-1 py-3 border border-plum/20 text-plum rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2">
              Home <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-linen" />}>
      <SuccessContent />
    </Suspense>
  );
}
