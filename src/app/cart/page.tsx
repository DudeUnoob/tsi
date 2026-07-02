'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { createOrder } from '@/lib/supabase';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const shippingCost = 5.00;
  const estimatedTax = cartTotal * 0.08;
  const grandTotal = cartTotal + shippingCost + estimatedTax;
  
  // Shipping & Mock Payment form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.name.trim()) tempErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address';
    }
    if (!formData.address.trim()) tempErrors.address = 'Address is required';
    if (!formData.city.trim()) tempErrors.city = 'City is required';
    if (!formData.state.trim()) tempErrors.state = 'State is required';
    if (!formData.zip.trim()) tempErrors.zip = 'Zip code is required';
    
    // Payment details validation (for local mock checkouts)
    const rawCard = formData.cardNumber.replace(/\s+/g, '');
    if (!rawCard.trim()) {
      tempErrors.cardNumber = 'Card number is required';
    } else if (rawCard.length !== 16) {
      tempErrors.cardNumber = 'Card must be 16 digits';
    }

    if (!formData.cardExpiry.trim()) {
      tempErrors.cardExpiry = 'Expiry is required';
    } else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.cardExpiry)) {
      tempErrors.cardExpiry = 'Format MM/YY required';
    }

    const rawCvv = formData.cardCvv.replace(/\D/g, '');
    if (!rawCvv.trim()) {
      tempErrors.cardCvv = 'CVC is required';
    } else if (rawCvv.length < 3 || rawCvv.length > 4) {
      tempErrors.cardCvv = 'Must be 3-4 digits';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setStatusMessage('Initiating order session...');

    try {
      // Call Stripe API checkout endpoint
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            id: item.id,
            product_title: item.product_title,
            slug: item.slug,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            stripe_price_id: item.stripe_price_id
          })),
          customerEmail: formData.email,
          customerName: formData.name,
          shippingAddress: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
          successUrl: window.location.origin + `/checkout/success`,
          cancelUrl: window.location.href
        })
      });

      const data = await response.json();

      if (data.url) {
        setStatusMessage('Redirecting to Stripe secure payment gateway...');
        
        // Save pending order record in Supabase / LocalStorage
        try {
          await createOrder({
            order_ref: data.sessionId || `session_${Date.now()}`,
            customer_name: formData.name,
            customer_email: formData.email,
            shipping_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
            total_amount: grandTotal,
            status: 'pending',
            items: cartItems.map(item => ({
              id: Number(item.id),
              product_title: item.product_title,
              price: item.price,
              quantity: item.quantity,
              size: item.size
            }))
          });
        } catch (e) {
          console.error('Failed to create pending order record:', e);
        }

        // Wait briefly for smooth user transition
        setTimeout(() => {
          window.location.href = data.url;
        }, 1200);
      } else {
        // Fallback simulation if Stripe keys are not configured
        setStatusMessage('Mock Mode: Stripe keys are not configured. Activating fallback...');
        
        setTimeout(() => {
          setStatusMessage('Processing payment security check...');
        }, 800);

        setTimeout(() => {
          setStatusMessage('Fulfilling mock purchase details...');
        }, 1600);

        const mockSessionId = `mock_${Date.now()}`;
        
        // Save paid order record in Supabase / LocalStorage
        try {
          await createOrder({
            order_ref: mockSessionId,
            customer_name: formData.name,
            customer_email: formData.email,
            shipping_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
            total_amount: grandTotal,
            status: 'paid',
            items: cartItems.map(item => ({
              id: Number(item.id),
              product_title: item.product_title,
              price: item.price,
              quantity: item.quantity,
              size: item.size
            }))
          });
        } catch (e) {
          console.error('Failed to create mock order record:', e);
        }

        setTimeout(() => {
          // Serialize cart details in localStorage/sessionStorage for the success page
          sessionStorage.setItem('sanga_last_order', JSON.stringify({
            name: formData.name,
            email: formData.email,
            address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
            total: grandTotal,
            items: cartItems
          }));
          clearCart();
          window.location.href = `/checkout/success?session_id=${mockSessionId}`;
        }, 2400);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setIsSubmitting(false);
      setStatusMessage('');
      alert('An error occurred during checkout. Please try again.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-linen min-h-screen py-24 font-sans text-warm-black flex items-center">
        <div className="max-w-xl mx-auto px-6 text-center space-y-6">
          <div className="w-20 h-20 bg-plum/5 border border-plum/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="h-8 w-8 text-plum/40" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-black text-plum">Your Cart is Empty</h1>
            <p className="text-sm text-warm-black/60 font-light max-w-sm mx-auto leading-relaxed">
              Looks like you haven&apos;t added any merchandise or upgrades to your catalog yet. Support Sanga by visiting the store.
            </p>
          </div>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-6 py-3 bg-plum text-linen hover:opacity-90 font-black text-xs uppercase tracking-widest rounded-full shadow-md transition-all active:scale-97 cursor-pointer"
          >
            Explore Store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linen min-h-screen py-16 font-sans text-warm-black relative">
      
      {/* Checkout Processing Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-plum/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-linen px-6 text-center select-none">
          <div className="space-y-6 max-w-sm">
            <Loader2 className="h-12 w-12 text-sunshine animate-spin mx-auto" />
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-black tracking-tight text-sunshine">
                Securing Transaction
              </h2>
              <p className="text-sm text-linen/85 font-light animate-pulse min-h-[40px]">
                {statusMessage}
              </p>
            </div>
            <div className="pt-4 border-t border-linen/15 flex items-center justify-center gap-2 text-xs text-linen/60">
              <Lock className="h-3.5 w-3.5" /> Fully Encrypted Checkout Session
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">
        {/* Page Header */}
        <div className="border-b border-plum/10 pb-8 mb-12">
          <h1 className="font-display text-3xl sm:text-5xl font-black text-plum">
            Shopping Cart
          </h1>
          <p className="text-sm text-warm-black/60 font-light mt-2">
            Review your Sanga merchandise and proceed to secure card payment.
          </p>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: Items List */}
          <div className="lg:col-span-7 space-y-6">
            {cartItems.map((item) => {
              const numericItemPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
              const itemTotal = (isNaN(numericItemPrice) ? 0 : numericItemPrice * item.quantity).toFixed(2);
              
              return (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex items-center gap-4 p-4 sm:p-5 bg-[#FFEFBF] rounded-2xl border border-[#6E0B64]/10 shadow-sm relative overflow-hidden group hover:border-[#6E0B64]/20 transition-all duration-200"
                >
                  {/* Image Display */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#6E0B64]/5 rounded-xl border border-[#6E0B64]/10 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.product_title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6E0B64]/20">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Metadata and Adjustments */}
                  <div className="flex-grow flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1.5">
                      <h3 className="font-display text-lg font-bold text-[#6E0B64] group-hover:text-[#E65C17] transition-colors leading-tight">
                        <Link href={`/store/${item.slug}`}>
                          {item.product_title}
                        </Link>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#1E1D1B]/70">
                        <span className="font-bold bg-[#6E0B64]/5 px-2 py-0.5 rounded border border-[#6E0B64]/5">
                          Size: {item.size}
                        </span>
                        <span>Unit: {item.price}</span>
                      </div>
                    </div>

                    {/* Quantity Adjustment Row */}
                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                      <div className="flex items-center bg-[#6E0B64]/5 border border-[#6E0B64]/10 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          className="px-2.5 py-1 text-sm font-black text-[#6E0B64] hover:bg-[#6E0B64]/10 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 font-bold text-xs text-[#6E0B64] w-8 text-center select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="px-2.5 py-1 text-sm font-black text-[#6E0B64] hover:bg-[#6E0B64]/10 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total Price */}
                      <span className="font-display font-black text-[#6E0B64] text-base min-w-[60px] text-right">
                        ${itemTotal}
                      </span>
                    </div>
                  </div>

                  {/* Deletion Trigger */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id, item.size)}
                    className="absolute top-4 right-4 p-1.5 text-[#1E1D1B]/40 hover:text-[#E65C17] transition-colors cursor-pointer"
                    aria-label="Remove item from cart"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right Side: Checkout Form & Totals */}
          <div className="lg:col-span-5 bg-[#FFEFBF] rounded-3xl border border-[#6E0B64]/10 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Shipping Form */}
            <form onSubmit={handleCheckout} className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#6E0B64] border-b border-[#6E0B64]/10 pb-2.5">
                Shipping Details
              </h2>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                    errors.name ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-[#E65C17] font-bold">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                    errors.email ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                  }`}
                />
                {errors.email && <p className="text-[10px] text-[#E65C17] font-bold">{errors.email}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                  Shipping Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Bhakti Way"
                  className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                    errors.address ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                  }`}
                />
                {errors.address && <p className="text-[10px] text-[#E65C17] font-bold">{errors.address}</p>}
              </div>

              {/* City, State, Zip grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Gita Town"
                    className={`w-full px-3.5 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                      errors.city ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                    }`}
                  />
                  {errors.city && <p className="text-[9px] text-[#E65C17] font-bold">{errors.city}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="PA"
                    className={`w-full px-3.5 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                      errors.state ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                    }`}
                  />
                  {errors.state && <p className="text-[9px] text-[#E65C17] font-bold">{errors.state}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    placeholder="19525"
                    className={`w-full px-3.5 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                      errors.zip ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                    }`}
                  />
                  {errors.zip && <p className="text-[9px] text-[#E65C17] font-bold">{errors.zip}</p>}
                </div>
              </div>

              {/* Card Information (Mock Fields) */}
              <div className="space-y-4 pt-4 border-t border-[#6E0B64]/10">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#6E0B64]">
                  Mock Payment Details
                </h3>
                
                {/* Card Number */}
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                      const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                      setFormData({ ...formData, cardNumber: formatted });
                      if (errors.cardNumber) setErrors({ ...errors, cardNumber: '' });
                    }}
                    placeholder="4111 2222 3333 4444"
                    className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                      errors.cardNumber ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                    }`}
                  />
                  {errors.cardNumber && <p className="text-[10px] text-[#E65C17] font-bold">{errors.cardNumber}</p>}
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                        if (val.length > 2) {
                          val = val.substring(0, 2) + '/' + val.substring(2);
                        }
                        setFormData({ ...formData, cardExpiry: val });
                        if (errors.cardExpiry) setErrors({ ...errors, cardExpiry: '' });
                      }}
                      placeholder="MM/YY"
                      className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                        errors.cardExpiry ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                      }`}
                    />
                    {errors.cardExpiry && <p className="text-[10px] text-[#E65C17] font-bold">{errors.cardExpiry}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      name="cardCvv"
                      value={formData.cardCvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                        setFormData({ ...formData, cardCvv: val });
                        if (errors.cardCvv) setErrors({ ...errors, cardCvv: '' });
                      }}
                      placeholder="123"
                      className={`w-full px-4 py-3 bg-[#FFEFBF] rounded-xl border text-sm focus:outline-none focus:border-[#6E0B64] font-sans ${
                        errors.cardCvv ? 'border-[#E65C17]' : 'border-[#6E0B64]/20'
                      }`}
                    />
                    {errors.cardCvv && <p className="text-[10px] text-[#E65C17] font-bold">{errors.cardCvv}</p>}
                  </div>
                </div>
              </div>

              {/* Order Calculations */}
              <div className="pt-6 border-t border-[#6E0B64]/10 space-y-3 font-sans text-sm">
                <div className="flex justify-between text-[#1E1D1B]/80 font-light">
                  <span>Subtotal</span>
                  <span className="font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#1E1D1B]/80 font-light">
                  <span>Shipping</span>
                  <span className="font-bold">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#1E1D1B]/80 font-light">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-bold">${estimatedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6E0B64] font-display text-lg font-black pt-2 border-t border-[#6E0B64]/5">
                  <span>Grand Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-[#6E0B64] hover:bg-[#E65C17] text-[#FFEFBF] font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg transition-all duration-300 transform active:scale-97 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" /> Place Secure Order
                </button>
              </div>
            </form>

            {/* Payment Trust Badges */}
            <div className="pt-4 border-t border-[#6E0B64]/10 flex items-center justify-center space-x-2 text-[10px] text-[#1E1D1B]/60 font-sans font-light">
              <ShieldCheck className="h-4 w-4 text-[#66CC6E]" />
              <span>SSL Encrypted Checkout Processing</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
