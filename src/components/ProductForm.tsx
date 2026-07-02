'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Check, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import ShopifyBuyButton from '@/components/ShopifyBuyButton';
import DynamicShopifyEmbed from '@/components/DynamicShopifyEmbed';

interface ProductFormProps {
  product: {
    id: number;
    product_title: string;
    slug: string;
    description: string;
    image: string;
    price: string;
    status: 'available' | 'unavailable' | 'sold-out';
    shopify_embed_code?: string;
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

  const isShopifyProduct = Boolean(product.shopify_embed_code) || product.slug === 'sanga-hoodie' || product.id === 1;

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
    <div className="space-y-4">
      {/* Price Tag */}
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-display font-black text-[#6E0B64]">
          {product.price}
        </span>
        <span className="text-[10px] text-[#1E1D1B]/50 uppercase tracking-widest font-black">
          + Shipping & Taxes
        </span>
      </div>

      {/* If item uses Shopify Buy Button Embed */}
      {isShopifyProduct ? (
        <div className="pt-2 space-y-3">
          <div className="bg-plum/5 p-4 rounded-2xl border border-plum/10 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-plum block">
              Direct Checkout & Variant Selection
            </span>
            {product.shopify_embed_code ? (
              <DynamicShopifyEmbed embedCode={product.shopify_embed_code} />
            ) : (
              <ShopifyBuyButton />
            )}
          </div>
        </div>
      ) : (
        /* Standard Non-Shopify Cart Flow */
        <div className="space-y-4">
          {/* Size Selector */}
          {isApparel ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest font-black text-plum">
                  Select Size
                </label>
                {errorMsg && (
                  <span className="text-xs text-[#E65C17] font-bold animate-pulse">
                    {errorMsg}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
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
                      className={`w-10 h-10 rounded-xl text-xs font-black border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-plum text-linen border-plum shadow-sm'
                          : 'bg-linen text-plum border-plum/20 hover:border-plum hover:bg-plum/5'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-black text-plum">
                Size
              </label>
              <div>
                <span className="inline-block px-3 py-1 bg-plum/5 text-plum border border-plum/10 rounded-lg text-[10px] uppercase font-black tracking-widest">
                  One Size Fits All
                </span>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-plum block">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-plum/5 border border-plum/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-base font-black text-plum hover:bg-plum/10 cursor-pointer transition-colors"
                >
                  -
                </button>
                <span className="px-3 py-1.5 font-bold text-xs text-plum w-10 text-center select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-base font-black text-plum hover:bg-plum/10 cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add To Cart Trigger */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-grow px-6 py-3.5 font-black uppercase text-[10px] tracking-widest rounded-xl shadow transition-all duration-300 transform active:scale-97 cursor-pointer flex items-center justify-center gap-2 ${
                added
                  ? 'bg-pink text-linen'
                  : 'bg-plum hover:bg-pink text-linen'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" /> Add To Cart
                </>
              )}
            </button>

            <Link
              href="/cart"
              className="px-5 py-3.5 border border-plum/20 hover:border-plum bg-linen text-plum font-black uppercase text-[10px] tracking-widest rounded-xl transition-all duration-200 text-center flex items-center justify-center cursor-pointer shadow-sm hover:shadow"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}

      {/* Purchase Trust Badges */}
      <div className="pt-4 border-t border-plum/15 space-y-2 text-[10px] text-warm-black/70 font-sans font-light">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-pink flex-shrink-0" />
          <span>Secure checkout via official storefront processing.</span>
        </div>
        <div className="flex items-center space-x-2">
          <Truck className="h-4 w-4 text-sunshine flex-shrink-0" />
          <span>Direct shipping &amp; fulfillment tracking included.</span>
        </div>
        <div className="flex items-center space-x-2">
          <RotateCcw className="h-4 w-4 text-pink flex-shrink-0" />
          <span>Exchanges available for size corrections at events.</span>
        </div>
      </div>
    </div>
  );
}
