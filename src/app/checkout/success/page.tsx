'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatMoney } from '@/lib/commerce';
import {
  notifyActiveCheckoutChanged,
  readStoredCheckout,
  shouldClearCartAfterCheckout,
  writeStoredCheckout,
} from '@/lib/checkout-client';
import {
  isAuthoritativeCheckoutSuccess,
  isTerminalCheckoutFailure,
} from './status';

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

type VerificationState = 'verifying' | 'confirmed' | 'unconfirmed' | 'error';

const MAX_VERIFICATION_ATTEMPTS = 20;
const VERIFICATION_INTERVAL_MS = 1_500;

function waitForNextVerification(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const handleAbort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException('Checkout verification aborted.', 'AbortError'));
    };
    const timeout = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, VERIFICATION_INTERVAL_MS);
    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

function SuccessContent() {
  const sessionId = useSearchParams().get('session_id') || '';
  const { clearCart } = useCart();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [verificationState, setVerificationState] =
    useState<VerificationState>('verifying');
  const [verificationError, setVerificationError] = useState('');
  const [verificationRun, setVerificationRun] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    if (!sessionId) {
      queueMicrotask(() => {
        setVerificationError('This return link is missing its Checkout Session. Return to your cart and resume Checkout.');
        setVerificationState('error');
      });
      return () => controller.abort();
    }

    const verifyPayment = async () => {
      setVerificationState('verifying');
      setVerificationError('');

      try {
        for (let attempt = 0; attempt < MAX_VERIFICATION_ATTEMPTS; attempt += 1) {
          const response = await fetch(
            `/api/checkout?session_id=${encodeURIComponent(sessionId)}`,
            {
              cache: 'no-store',
              signal: controller.signal,
            },
          );
          const data = await response.json() as SessionSummary & { error?: string };
          if (!response.ok) {
            throw new Error(data.error || 'Unable to verify payment.');
          }

          setSummary(data);
          if (isAuthoritativeCheckoutSuccess(data)) {
            setVerificationState('confirmed');
            try {
              const activeCheckout = readStoredCheckout(localStorage);
              if (shouldClearCartAfterCheckout(activeCheckout, data.id)) {
                writeStoredCheckout(localStorage, null);
                notifyActiveCheckoutChanged();
                clearCart();
              }
            } catch {
              // Never discard a different or damaged cart from a delayed
              // success page. The server has synchronized this order.
            }
            return;
          }

          if (isTerminalCheckoutFailure(data)) {
            setVerificationState('unconfirmed');
            return;
          }

          if (attempt < MAX_VERIFICATION_ATTEMPTS - 1) {
            await waitForNextVerification(controller.signal);
          }
        }

        throw new Error(
          'Stripe is taking longer than expected to confirm this payment. Retry verification before placing another order.',
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setVerificationError(
          error instanceof Error ? error.message : 'Unable to verify payment.',
        );
        setVerificationState('error');
      }
    };

    void verifyPayment();
    return () => controller.abort();
  }, [sessionId, clearCart, verificationRun]);

  const paid = summary?.paymentStatus === 'paid';
  const processing = summary?.paymentStatus === 'processing';
  const verifying = verificationState === 'verifying';
  const verificationFailed = verificationState === 'error';
  const confirmed = verificationState === 'confirmed';

  const retryVerification = () => {
    setSummary(null);
    setVerificationRun(run => run + 1);
  };

  return (
    <div className="bg-linen min-h-screen flex items-center py-16 text-warm-black">
      <div className="max-w-xl mx-auto px-6 w-full">
        <div
          className="rounded-3xl border border-plum/10 bg-linen p-8 shadow-sm text-center"
          aria-live="polite"
        >
          {verifying ? (
            <Loader2 className="h-12 w-12 animate-spin text-plum mx-auto" />
          ) : verificationFailed ? (
            <AlertCircle className="h-12 w-12 text-pink mx-auto" />
          ) : (
            <CheckCircle2 className={`h-12 w-12 mx-auto ${confirmed ? 'text-pink' : 'text-plum/35'}`} />
          )}
          <h1 className="font-display text-3xl font-black text-plum mt-5">
            {verifying
              ? 'Verifying Payment'
              : verificationFailed
                ? 'Verification Interrupted'
                : paid
                  ? summary?.inventoryException
                    ? 'Payment Received — Order Review Required'
                    : 'Thank You for Your Order!'
                  : processing
                    ? 'Payment Processing'
                    : 'Payment Not Confirmed'}
          </h1>
          <p className="text-sm text-warm-black/65 mt-3">
            {verifying
              ? 'Stripe is confirming your payment and we are synchronizing your order. Keep this page open.'
              : verificationFailed
                ? verificationError
                : paid
                  ? summary?.inventoryException
                    ? 'Your payment is confirmed. Our team has been alerted to review merchandise availability before fulfillment.'
                    : 'Your payment is confirmed and the order is ready for fulfillment.'
                  : processing
                    ? 'Stripe is still processing your payment. Do not place another order; we will update this order when processing finishes.'
                    : 'This Checkout Session was not paid. Return to your cart or contact us before placing another order.'}
          </p>

          {confirmed && summary && (
            <div className="text-left rounded-2xl bg-plum/5 border border-plum/10 p-5 mt-6 text-sm space-y-2">
              <div className="flex justify-between"><span>Order</span><strong>{summary.id.slice(0, 16)}…</strong></div>
              {summary.customerEmail && <div className="flex justify-between gap-4"><span>Checkout email</span><strong className="truncate">{summary.customerEmail}</strong></div>}
              {typeof summary.amountTotal === 'number' && (
                <div className="flex justify-between"><span>Total paid</span><strong>{formatMoney(summary.amountTotal, summary.currency)}</strong></div>
              )}
            </div>
          )}

          {verificationFailed && (
            <button
              type="button"
              onClick={retryVerification}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-plum px-5 py-3 text-xs font-black uppercase tracking-widest text-linen"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Verification
            </button>
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
