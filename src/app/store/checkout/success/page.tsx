'use client';

import React, { useEffect, useState } from 'react';
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

export default function CheckoutSuccessPage() {
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
    <div className="bg-[#FFEFBF] min-h-screen py-16 font-sans text-[#1E1D1B] flex items-center">
      <div className="max-w-3xl mx-auto px-6 w-full">
        <div className="bg-[#FFEFBF] rounded-3xl border border-[#6E0B64]/10 p-8 sm:p-12 shadow-sm text-center space-y-8 relative overflow-hidden">
          
          {/* Success Header */}
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#66CC6E]/10 border border-[#66CC6E]/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-[#66CC6E]" />
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-[#E65C17] font-black">
                Payment Received
              </span>
              <h1 className="font-display text-3xl sm:text-5xl font-black text-[#6E0B64]">
                Thank You for Your Order!
              </h1>
            </div>
            <p className="text-sm text-[#1E1D1B]/70 font-light max-w-md mx-auto leading-relaxed">
              Your transaction was completed successfully. A receipt and order confirmation has been emailed to you.
            </p>
          </div>

          {/* Details Box */}
          <div className="border-t border-b border-[#6E0B64]/10 py-6 my-6 text-left grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-display font-bold text-[#6E0B64] uppercase text-xs tracking-wider">
                Order Information
              </h3>
              <div className="space-y-1.5 font-light text-[#1E1D1B]/80 text-xs">
                <div>
                  <span className="font-bold text-[#6E0B64]/60">Order Ref:</span> {orderNumber}
                </div>
                <div>
                  <span className="font-bold text-[#6E0B64]/60">Status:</span>{' '}
                  <span className="font-black text-[#66CC6E] uppercase tracking-wider text-[10px] bg-[#66CC6E]/5 px-2 py-0.5 rounded border border-[#66CC6E]/10">
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
              <div className="space-y-3">
                <h3 className="font-display font-bold text-[#6E0B64] uppercase text-xs tracking-wider">
                  Shipping Destination
                </h3>
                <p className="text-xs font-light text-[#1E1D1B]/80 leading-relaxed">
                  {orderInfo.address}
                </p>
              </div>
            )}
          </div>

          {/* Items Summary (from local state fallback details) */}
          {orderInfo && orderInfo.items && (
            <div className="text-left space-y-3 bg-[#6E0B64]/5 p-5 rounded-2xl border border-[#6E0B64]/5">
              <h3 className="font-display font-bold text-[#6E0B64] uppercase text-xs tracking-wider">
                Purchased Items
              </h3>
              <div className="divide-y divide-[#6E0B64]/10">
                {orderInfo.items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="py-2.5 flex justify-between items-center text-xs font-sans">
                    <div className="space-y-1">
                      <span className="font-bold text-[#6E0B64]">{item.product_title}</span>
                      <span className="text-[10px] text-[#1E1D1B]/50 block">Size Selection: {item.size}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-light text-[#1E1D1B]/70">x{item.quantity}</span>
                      <span className="font-bold text-[#6E0B64] ml-4">{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-[#6E0B64]/10 flex justify-between items-center text-sm">
                <span className="font-display font-bold text-[#6E0B64]">Total Paid</span>
                <span className="font-display font-black text-[#E65C17] text-base">${orderInfo.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#6E0B64] hover:bg-[#E65C17] text-[#FFEFBF] font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-97 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" /> Return to Store
            </Link>
            <Link
              href="/gatherings"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-[#6E0B64]/20 hover:border-[#6E0B64] text-[#6E0B64] font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer bg-[#FFEFBF]"
            >
              View Retreats <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Contact help line */}
          <div className="pt-6 border-t border-[#6E0B64]/5 flex items-center justify-center gap-2 text-[10px] text-[#1E1D1B]/50 font-sans">
            <Mail className="h-3.5 w-3.5" /> Questions or changes? Reach out to info@sangainitiative.org
          </div>

        </div>
      </div>
    </div>
  );
}
