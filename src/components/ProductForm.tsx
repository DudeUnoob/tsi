'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Check, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface ProductFormProps {
  product: {
    id: number;
    product_title: string;
    slug: string;
    description: string;
    image: string;
    price: string;
    status: 'available' | 'unavailable' | 'sold-out';
    stripe_price_id?: string;
    stripe_product_id?: string;
  };
}

export default function ProductForm({ product }: ProductFormProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isApparel = 
    product.slug.includes('hoodie') || 
    product.slug.includes('tshirt') || 
    product.slug.includes('tee');

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const sizeToUse = isApparel ? selectedSize : 'One Size';

  const handleAddToCart = () => {
    if (isApparel && !selectedSize) {
      setErrorMsg('Please select a size');
      return;
    }
    setErrorMsg('');
    addToCart(product, sizeToUse, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Price Tag */}
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-display font-black text-[#6E0B64]">
          {product.price}
        </span>
        <span className="text-xs text-[#1E1D1B]/50 uppercase tracking-widest font-black">
          + Shipping & Taxes
        </span>
      </div>

      {/* Size Selector */}
      {isApparel ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
              Select Size
            </label>
            {errorMsg && (
              <span className="text-xs text-[#E65C17] font-bold animate-pulse">
                {errorMsg}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setErrorMsg('');
                  }}
                  className={`w-12 h-12 rounded-xl text-sm font-black border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#6E0B64] text-[#FFEFBF] border-[#6E0B64] shadow-md'
                      : 'bg-[#FFEFBF] text-[#6E0B64] border-[#6E0B64]/20 hover:border-[#6E0B64] hover:bg-[#6E0B64]/5'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64]">
            Size
          </label>
          <div>
            <span className="inline-block px-4 py-2 bg-[#6E0B64]/5 text-[#6E0B64] border border-[#6E0B64]/10 rounded-xl text-xs uppercase font-black tracking-widest">
              One Size Fits All
            </span>
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-widest font-black text-[#6E0B64] block">
          Quantity
        </label>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-[#6E0B64]/5 border border-[#6E0B64]/10 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2.5 text-lg font-black text-[#6E0B64] hover:bg-[#6E0B64]/10 cursor-pointer transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2.5 font-bold text-[#6E0B64] w-12 text-center select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2.5 text-lg font-black text-[#6E0B64] hover:bg-[#6E0B64]/10 cursor-pointer transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Add To Cart Trigger */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          className={`flex-grow px-8 py-4 font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg transition-all duration-300 transform active:scale-97 cursor-pointer flex items-center justify-center gap-2 ${
            added
              ? 'bg-[#66CC6E] text-[#FFEFBF]'
              : 'bg-[#6E0B64] hover:bg-[#E65C17] text-[#FFEFBF]'
          }`}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> Added to Cart!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Add To Cart
            </>
          )}
        </button>

        <Link
          href="/store/cart"
          className="px-6 py-4 border border-[#6E0B64]/20 hover:border-[#6E0B64] bg-[#FFEFBF] text-[#6E0B64] font-black uppercase text-xs tracking-widest rounded-2xl transition-all duration-200 text-center flex items-center justify-center cursor-pointer shadow-sm hover:shadow"
        >
          View Cart
        </Link>
      </div>

      {/* Purchase Trust Badges */}
      <div className="pt-6 border-t border-[#6E0B64]/15 space-y-3 text-xs text-[#1E1D1B]/70 font-sans font-light">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="h-4.5 w-4.5 text-[#66CC6E] flex-shrink-0" />
          <span>Secure checkout via Stripe processing.</span>
        </div>
        <div className="flex items-center space-x-2.5">
          <Truck className="h-4.5 w-4.5 text-[#FFA526] flex-shrink-0" />
          <span>Fulfillment coordination across retreat sites.</span>
        </div>
        <div className="flex items-center space-x-2.5">
          <RotateCcw className="h-4.5 w-4.5 text-[#FF7DB4] flex-shrink-0" />
          <span>Exchanges available for size corrections at events.</span>
        </div>
      </div>
    </div>
  );
}
