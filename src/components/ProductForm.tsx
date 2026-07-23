'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Check, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { getProductInventory, ProductInventory } from '@/lib/firebase';
import type { StoreProduct } from '@/lib/types';

interface ProductFormProps {
  product: StoreProduct;
}

export default function ProductForm({ product }: ProductFormProps) {
  const { addToCart } = useCart();
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isApparel = product.variant_type === 'size';

  useEffect(() => {
    getProductInventory(product.id)
      .then((data) => {
        setInventory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching product inventory:', err);
        setLoading(false);
      });
  }, [product.id]);

  const sizes = ['S', 'M', 'L', 'XL'];
  const sizeToUse = isApparel ? selectedSize : 'OS';

  // Get current stock for size
  const getStockForSize = (sizeName: string) => {
    const inv = inventory.find(i => i.size.toUpperCase() === sizeName.toUpperCase());
    return inv ? inv.stock : 0;
  };

  const currentStock = getStockForSize(sizeToUse);
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isApparel && !selectedSize) {
      setErrorMsg('Please select a size');
      return;
    }

    if (isOutOfStock) {
      setErrorMsg('Selected size is out of stock');
      return;
    }

    if (quantity > currentStock) {
      setErrorMsg(`Only ${currentStock} item(s) left in stock`);
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
        <span className="text-2xl font-display font-black text-[var(--color-plum)]">
          {product.price}
        </span>
        <span className="text-[10px] text-[var(--color-warm-black)]/50 uppercase tracking-widest font-black">
          + $5 US shipping
        </span>
      </div>

      <div className="space-y-4">
        {/* Size Selector */}
        {isApparel ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-widest font-black text-plum">
                Select Size
              </label>
              {errorMsg && (
                <span className="text-xs text-[var(--color-pink)] font-bold animate-pulse">
                  {errorMsg}
                </span>
              )}
            </div>
            {loading ? (
              <div className="text-xs text-plum/50 font-sans italic animate-pulse">Checking stock levels...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const stock = getStockForSize(size);
                  const isSoldOut = stock <= 0;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        setSelectedSize(size);
                        setErrorMsg('');
                      }}
                      className={`w-14 h-10 rounded-xl text-xs font-black border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${
                        isSoldOut
                          ? 'bg-warm-black/5 text-warm-black/30 border-warm-black/10 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-plum text-linen border-plum shadow-sm'
                          : 'bg-linen text-plum border-plum/20 hover:border-plum hover:bg-plum/5'
                      }`}
                    >
                      <span>{size}</span>
                      <span className={`text-[8px] font-sans ${isSoldOut ? 'text-warm-black/30' : isSelected ? 'text-linen/75' : 'text-plum/60'}`}>
                        {isSoldOut ? 'Sold' : `${stock} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-black text-plum">
              Size
            </label>
            <div>
              {loading ? (
                <div className="text-xs text-plum/50 font-sans italic animate-pulse">Checking stock levels...</div>
              ) : (
                <span className="inline-block px-3 py-1 bg-plum/5 text-plum border border-plum/10 rounded-lg text-[10px] uppercase font-black tracking-widest">
                  One Size Fits All ({getStockForSize('OS')} left)
                </span>
              )}
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
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-base font-black text-plum hover:bg-plum/10 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="px-3 py-1.5 font-bold text-xs text-plum w-10 text-center select-none">
                {isOutOfStock ? 0 : quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= currentStock || isOutOfStock}
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1.5 text-base font-black text-plum hover:bg-plum/10 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            {!loading && isOutOfStock && (
              <span className="text-xs font-black text-[var(--color-pink)] uppercase tracking-wider">
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Add To Cart Trigger */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={isOutOfStock || loading}
            onClick={handleAddToCart}
            className={`flex-grow px-6 py-3.5 font-black uppercase text-[10px] tracking-widest rounded-xl shadow transition-all duration-300 transform active:scale-97 cursor-pointer flex items-center justify-center gap-2 ${
              isOutOfStock
                ? 'bg-warm-black/10 border border-warm-black/10 text-warm-black/40 cursor-not-allowed'
                : added
                ? 'bg-pink text-linen'
                : 'bg-plum hover:bg-pink text-linen'
            }`}
          >
            {isOutOfStock ? (
              'Sold Out'
            ) : added ? (
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
