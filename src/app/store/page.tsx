import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getCachedProductInventory as getProductInventory, getCachedProducts as getProducts } from '@/lib/cached-data';
import { ShoppingBag, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const revalidate = 60; // Shorter: reflects stock counts
export const metadata: Metadata = {
  title: 'Store',
  description: 'Shop official Sanga apparel and merchandise supporting the Vaishnava youth community.',
  alternates: { canonical: 'https://www.sangainitiative.org/store' },
};

export default async function StorePage() {
  const products = await getProducts();
  const inventoryByProduct = new Map(
    await Promise.all(products.map(async product => [
      product.id,
      await getProductInventory(product.id),
    ] as const)),
  );

  return (
    <div className="bg-linen min-h-screen py-16 font-sans text-warm-black">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-pink font-black font-sans bg-plum/5 py-1.5 px-4 rounded-full border border-plum/10">
            Sanga Merch
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-plum">
            Official Merchandise
          </h1>
          <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans font-light">
            Support Sanga with official apparel and accessories, shipped anywhere in the United States for a flat $5 rate.
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
            {products.map((product, idx) => {
              const isAvailable = product.status === 'available';
              const isSoldOut = inventoryByProduct
                .get(product.id)
                ?.every(item => (item.available ?? 0) < 1) ?? true;
              
              // Feature the hoodie, or the first product as fallback
              const isFeatured = product.slug === 'sanga-rebrand-hoodie' || (idx === 0 && !products.some(p => p.slug === 'sanga-rebrand-hoodie'));

              if (isFeatured) {
                return (
                  <div 
                    key={product.id}
                    className="col-span-1 md:col-span-8 group flex flex-col md:flex-row glass rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    {/* Featured label tag */}
                    <span className="absolute top-4 right-4 z-20 px-3.5 py-1 text-[8px] font-black uppercase tracking-widest bg-plum text-linen rounded-full shadow-sm select-none">
                      Featured Item
                    </span>

                    {/* Image wrapper */}
                    <Link 
                      href={`/store/${product.slug}`}
                      className="relative h-72 md:h-auto md:w-1/2 bg-plum/5 overflow-hidden block min-h-[300px]"
                    >
                      {product.image ? (
                        <Image 
                          src={product.image} 
                          alt={product.product_title}
                          fill
                          className="object-cover group-hover:scale-103 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-plum/20">
                          <ShoppingBag className="h-16 w-16" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      {isSoldOut && (
                        <span className="absolute top-4 left-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-pink text-linen rounded-full shadow-sm select-none">
                          Sold Out
                        </span>
                      )}
                      {!isAvailable && !isSoldOut && (
                        <span className="absolute top-4 left-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-warm-black/25 text-linen rounded-full shadow-sm select-none">
                          Unavailable
                        </span>
                      )}
                    </Link>

                    {/* Description Box */}
                    <div className="p-8 flex-grow flex flex-col justify-between md:w-1/2 space-y-6">
                      <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-pink">
                          Official Apparel
                        </span>
                        <h2 className="font-display text-3xl font-black text-plum group-hover:text-pink transition-colors leading-tight">
                          <Link href={`/store/${product.slug}`}>
                            {product.product_title}
                          </Link>
                        </h2>
                        <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                          {product.description}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-plum/10 flex items-center justify-between mt-auto">
                        <span className="text-2xl font-display font-black text-plum">
                          {product.price}
                        </span>
                        
                        {isAvailable ? (
                          <Link
                            href={`/store/${product.slug}`}
                            className="px-6 py-3.5 bg-plum text-linen hover:bg-pink hover:text-linen font-black text-xs uppercase tracking-widest rounded-full shadow-md transition-all duration-200 inline-flex items-center gap-1.5 active:scale-97 cursor-pointer"
                          >
                            View Details <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="px-6 py-3.5 bg-warm-black/5 border border-warm-black/10 text-warm-black/40 font-black text-xs uppercase tracking-widest rounded-full cursor-not-allowed select-none"
                          >
                            {isSoldOut ? 'Sold Out' : 'Unavailable'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={product.id}
                  className="col-span-1 md:col-span-4 group flex flex-col glass rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image wrapper */}
                  <Link 
                    href={`/store/${product.slug}`}
                    className="relative h-64 w-full bg-plum/5 overflow-hidden block"
                  >
                    {product.image ? (
                      <Image 
                        src={product.image} 
                        alt={product.product_title}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-plum/20">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {isSoldOut && (
                      <span className="absolute top-4 left-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-pink text-linen rounded-full shadow-sm select-none">
                        Sold Out
                      </span>
                    )}
                    {!isAvailable && !isSoldOut && (
                      <span className="absolute top-4 left-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-warm-black/25 text-linen rounded-full shadow-sm select-none">
                        Unavailable
                      </span>
                    )}
                  </Link>

                  {/* Description Box */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <h2 className="font-display text-2xl font-bold text-plum group-hover:text-pink transition-colors leading-tight">
                        <Link href={`/store/${product.slug}`}>
                          {product.product_title}
                        </Link>
                      </h2>
                      <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light line-clamp-3">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-plum/10 flex items-center justify-between mt-auto">
                      <span className="text-xl font-display font-black text-plum">
                        {product.price}
                      </span>
                      
                      {isAvailable ? (
                        <Link
                          href={`/store/${product.slug}`}
                          className="px-5 py-2.5 bg-plum text-linen hover:bg-pink hover:text-linen font-black text-xs uppercase tracking-widest rounded-full shadow-md transition-all duration-200 inline-flex items-center gap-1 active:scale-97 cursor-pointer"
                        >
                          View Details <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="px-5 py-2.5 bg-warm-black/5 border border-warm-black/10 text-warm-black/40 font-black text-xs uppercase tracking-widest rounded-full cursor-not-allowed select-none"
                        >
                          {isSoldOut ? 'Sold Out' : 'Unavailable'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-plum/5 rounded-3xl border border-dashed border-plum/15 max-w-xl mx-auto mb-16">
            <ShoppingBag className="mx-auto h-12 w-12 text-plum/25 mb-4 animate-bounce" />
            <h3 className="font-display text-2xl font-bold text-plum mb-2">No Merch Available</h3>
            <p className="text-sm text-warm-black/60 font-sans font-light">
              There are currently no merchandise items available. Keep an eye out for an upcoming drop.
            </p>
          </div>
        )}

        {/* Security / Safe checkout notes */}
        <div className="max-w-xl mx-auto text-center py-4 px-6 bg-plum/5 rounded-2xl border border-plum/5 flex items-center justify-center space-x-2.5">
          <ShieldCheck className="h-5 w-5 text-mint-green flex-shrink-0" />
          <span className="text-xs text-warm-black/75 font-sans font-bold">
            Payment and shipping details are collected securely by Stripe Checkout.
          </span>
        </div>

      </div>
    </div>
  );
}
