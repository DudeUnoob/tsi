'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { updateOrderStatus } from '@/lib/supabase';

interface OrderSummary {
  name: string;
  email: string;
  address: string;
  total: number;
  items: Array<{
    id: number;
    product_title: string;
    price: string;
    quantity: number;
    size: string;
  }>;
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const { clearCart } = useCart();
  const [orderInfo, setOrderInfo] = useState<OrderSummary | null>(null);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Clear cart automatically on successful payment landing
    clearCart();

    // Check if we have mock order details in sessionStorage
    const storedOrder = sessionStorage.getItem('sanga_last_order');
    if (storedOrder) {
      try {
        setOrderInfo(JSON.parse(storedOrder));
        sessionStorage.removeItem('sanga_last_order'); // clean up
      } catch (e) {
        console.error('Failed to parse last order from sessionStorage', e);
      }
    }

    // Generate a clean reference number
    if (sessionId) {
      const shortId = sessionId.substring(0, 12) + '...';
      setOrderNumber(sessionId.startsWith('mock_') ? sessionId : shortId);
      
      // Update the status in the database/localStorage to paid
      updateOrderStatus(sessionId, 'paid').catch(err => {
        console.error('Failed to update order status to paid:', err);
      });
    } else {
      setOrderNumber(`mock_${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [sessionId, clearCart]);

  return (
    <div className="bg-linen min-h-screen py-4 sm:py-6 font-sans text-warm-black flex flex-col justify-center items-center">
      <div className="max-w-2xl mx-auto px-6 w-full">
        <div className="bg-linen rounded-3xl border border-plum/10 p-5 sm:p-8 shadow-sm text-center space-y-4 relative overflow-hidden">
          
          {/* Success Header */}
          <div className="space-y-2">
            <div className="w-11 h-11 bg-pink/10 border border-pink/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-pink" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-widest text-pink font-black">
                Payment Received
              </span>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-plum leading-tight">
                Thank You for Your Order!
              </h1>
            </div>
            <p className="text-xs text-warm-black/70 font-light max-w-md mx-auto leading-relaxed">
              Your transaction was completed successfully. A receipt and order confirmation has been emailed to you.
            </p>
          </div>

          {/* Details Box */}
          <div className="border-t border-b border-plum/10 py-3.5 my-3.5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <h3 className="font-display font-bold text-plum uppercase text-[10px] tracking-wider">
                Order Information
              </h3>
              <div className="space-y-1 font-light text-warm-black/80 text-[11px]">
                <div>
                  <span className="font-bold text-plum/60">Order Ref:</span> {orderNumber}
                </div>
                <div>
                  <span className="font-bold text-plum/60">Status:</span>{' '}
                  <span className="font-black text-pink uppercase tracking-wider text-[9px] bg-pink/5 px-2 py-0.5 rounded border border-pink/10">
                    Paid & Confirmed
                  </span>
                </div>
                {orderInfo && (
                  <>
                    <div>
                      <span className="font-bold text-plum/60">Customer:</span> {orderInfo.name}
                    </div>
                    <div>
                      <span className="font-bold text-plum/60">Email:</span> {orderInfo.email}
                    </div>
                  </>
                )}
              </div>
            </div>

            {orderInfo && (
              <div className="space-y-2">
                <h3 className="font-display font-bold text-plum uppercase text-[10px] tracking-wider">
                  Shipping Destination
                </h3>
                <p className="text-[11px] font-light text-warm-black/80 leading-relaxed">
                  {orderInfo.address}
                </p>
              </div>
            )}
          </div>

          {/* Items Summary */}
          {orderInfo && orderInfo.items && (
            <div className="text-left space-y-2 bg-plum/5 p-4 rounded-2xl border border-plum/5">
              <h3 className="font-display font-bold text-plum uppercase text-[10px] tracking-wider">
                Purchased Items
              </h3>
              <div className="divide-y divide-plum/10 max-h-[140px] overflow-y-auto pr-1">
                {orderInfo.items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="py-2 flex justify-between items-center text-[11px] font-sans">
                    <div className="space-y-0.5">
                      <span className="font-bold text-plum">{item.product_title}</span>
                      <span className="text-[9px] text-warm-black/50 block">Size Selection: {item.size}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-light text-warm-black/70">x{item.quantity}</span>
                      <span className="font-bold text-plum ml-4">{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-plum/10 flex justify-between items-center text-xs">
                <span className="font-display font-bold text-plum">Total Paid</span>
                <span className="font-display font-black text-pink text-sm">${orderInfo.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex flex-row gap-3 justify-center w-full">
            <Link
              href="/store"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-plum hover:opacity-90 text-linen font-black text-[10px] uppercase tracking-widest rounded-xl shadow transition-all active:scale-97 cursor-pointer text-center"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Return to Store
            </Link>
            <Link
              href="/gatherings"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-plum/20 hover:border-plum text-plum font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer bg-linen text-center"
            >
              View Retreats <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Contact help line */}
          <div className="pt-3 border-t border-plum/5 flex items-center justify-center gap-1.5 text-[9px] text-warm-black/50 font-sans">
            <Mail className="h-3 w-3" /> Questions or changes? Reach out to info@sangainitiative.org
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="bg-linen min-h-screen py-12 font-sans text-warm-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-plum border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-display font-bold text-plum animate-pulse">Loading order details...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
