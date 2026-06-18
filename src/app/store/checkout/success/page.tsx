'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { useCart } from '@/context/CartContext';

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
    } else {
      setOrderNumber(`mock_${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [sessionId, clearCart]);

  return (
    <div className="bg-[#FFEFBF] min-h-screen py-4 sm:py-6 font-sans text-[#1E1D1B] flex flex-col justify-center items-center">
      <div className="max-w-2xl mx-auto px-6 w-full">
        <div className="bg-[#FFEFBF] rounded-3xl border border-[#6E0B64]/10 p-5 sm:p-8 shadow-sm text-center space-y-4 relative overflow-hidden">
          
          {/* Success Header */}
          <div className="space-y-2">
            <div className="w-11 h-11 bg-[#66CC6E]/10 border border-[#66CC6E]/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-[#66CC6E]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-widest text-[#E65C17] font-black">
                Payment Received
              </span>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-[#6E0B64] leading-tight">
                Thank You for Your Order!
              </h1>
            </div>
            <p className="text-xs text-[#1E1D1B]/70 font-light max-w-md mx-auto leading-relaxed">
              Your transaction was completed successfully. A receipt and order confirmation has been emailed to you.
            </p>
          </div>

          {/* Details Box */}
          <div className="border-t border-b border-[#6E0B64]/10 py-3.5 my-3.5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <h3 className="font-display font-bold text-[#6E0B64] uppercase text-[10px] tracking-wider">
                Order Information
              </h3>
              <div className="space-y-1 font-light text-[#1E1D1B]/80 text-[11px]">
                <div>
                  <span className="font-bold text-[#6E0B64]/60">Order Ref:</span> {orderNumber}
                </div>
                <div>
                  <span className="font-bold text-[#6E0B64]/60">Status:</span>{' '}
                  <span className="font-black text-[#66CC6E] uppercase tracking-wider text-[9px] bg-[#66CC6E]/5 px-2 py-0.5 rounded border border-[#66CC6E]/10">
                    Paid & Confirmed
                  </span>
                </div>
                {orderInfo && (
                  <>
                    <div>
                      <span className="font-bold text-[#6E0B64]/60">Customer:</span> {orderInfo.name}
                    </div>
                    <div>
                      <span className="font-bold text-[#6E0B64]/60">Email:</span> {orderInfo.email}
                    </div>
                  </>
                )}
              </div>
            </div>

            {orderInfo && (
              <div className="space-y-2">
                <h3 className="font-display font-bold text-[#6E0B64] uppercase text-[10px] tracking-wider">
                  Shipping Destination
                </h3>
                <p className="text-[11px] font-light text-[#1E1D1B]/80 leading-relaxed">
                  {orderInfo.address}
                </p>
              </div>
            )}
          </div>

          {/* Items Summary */}
          {orderInfo && orderInfo.items && (
            <div className="text-left space-y-2 bg-[#6E0B64]/5 p-4 rounded-2xl border border-[#6E0B64]/5">
              <h3 className="font-display font-bold text-[#6E0B64] uppercase text-[10px] tracking-wider">
                Purchased Items
              </h3>
              <div className="divide-y divide-[#6E0B64]/10 max-h-[140px] overflow-y-auto pr-1">
                {orderInfo.items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="py-2 flex justify-between items-center text-[11px] font-sans">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#6E0B64]">{item.product_title}</span>
                      <span className="text-[9px] text-[#1E1D1B]/50 block">Size Selection: {item.size}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-light text-[#1E1D1B]/70">x{item.quantity}</span>
                      <span className="font-bold text-[#6E0B64] ml-4">{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#6E0B64]/10 flex justify-between items-center text-xs">
                <span className="font-display font-bold text-[#6E0B64]">Total Paid</span>
                <span className="font-display font-black text-[#E65C17] text-sm">${orderInfo.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex flex-row gap-3 justify-center w-full">
            <Link
              href="/store"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-[#6E0B64] hover:bg-[#E65C17] text-[#FFEFBF] font-black text-[10px] uppercase tracking-widest rounded-xl shadow transition-all active:scale-97 cursor-pointer text-center"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Return to Store
            </Link>
            <Link
              href="/gatherings"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-[#6E0B64]/20 hover:border-[#6E0B64] text-[#6E0B64] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer bg-[#FFEFBF] text-center"
            >
              View Retreats <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Contact help line */}
          <div className="pt-3 border-t border-[#6E0B64]/5 flex items-center justify-center gap-1.5 text-[9px] text-[#1E1D1B]/50 font-sans">
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
      <div className="bg-[#FFEFBF] min-h-screen py-12 font-sans text-[#1E1D1B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#6E0B64] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-display font-bold text-[#6E0B64] animate-pulse">Loading order details...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
