import React from 'react';
import Image from 'next/image';
import { getProducts } from '@/lib/supabase';
import { ShoppingBag, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const revalidate = 0;

export default async function StorePage() {
  const products = await getProducts();

  return (
    <div className="bg-linen min-h-screen py-16 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-wider text-tangerine font-bold font-sans">
            Sanga Merch
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-plum mt-2 mb-6">
            Merchandise & Retreat Upgrades
          </h1>
          <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans">
            Support Sanga and prepare for your gatherings. Book premium cabin accommodations or secure official retreat apparel here.
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {products.map(product => {
              const isAvailable = product.status === 'available';
              const isSoldOut = product.status === 'sold-out';
              
              return (
                <div 
                  key={product.id}
                  className="group flex flex-col bg-linen rounded-3xl border border-plum/10 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  {/* Image wrapper */}
                  <div className="relative h-64 w-full bg-plum/5 overflow-hidden">
                    {product.image ? (
                      <Image 
                        src={product.image} 
                        alt={product.product_title}
                        fill
                        className="object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-plum/20">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {isSoldOut && (
                      <span className="absolute top-4 left-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-tangerine text-linen rounded-full shadow-sm">
                        Sold Out
                      </span>
                    )}
                    {!isAvailable && !isSoldOut && (
                      <span className="absolute top-4 left-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-warm-black/25 text-linen rounded-full shadow-sm">
                        Unavailable
                      </span>
                    )}
                  </div>

                  {/* Description Box */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h2 className="font-display text-xl font-bold text-plum group-hover:text-tangerine transition-colors leading-tight">
                        {product.product_title}
                      </h2>
                      <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light line-clamp-3">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-plum/5 flex items-center justify-between mt-auto">
                      <span className="text-lg font-display font-bold text-plum">
                        {product.price}
                      </span>
                      
                      {/* TODO: Stripe replacement can be done here.
                          If product.stripePriceId is configured, render a payment request button referencing `/api/checkout?priceId=${product.stripePriceId}`
                          rather than navigating to Squarespace external checkouts. */}
                      {isAvailable && product.external_checkout_url ? (
                        <a
                          href={product.external_checkout_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 bg-plum text-linen hover:bg-tangerine hover:text-linen font-bold text-xs uppercase tracking-wider rounded-full shadow-sm transition-all duration-200 inline-flex items-center"
                        >
                          Checkout <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <button
                          disabled
                          className="px-5 py-2.5 bg-warm-black/10 text-warm-black/45 font-bold text-xs uppercase tracking-wider rounded-full cursor-not-allowed"
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
          <div className="text-center py-20 bg-plum/5 rounded-3xl border border-dashed border-plum/15 max-w-xl mx-auto mb-16">
            <ShoppingBag className="mx-auto h-12 w-12 text-plum/25 mb-4" />
            <h3 className="font-display text-xl font-bold text-plum mb-2">No Merch Available</h3>
            <p className="text-sm text-warm-black/60 font-sans">
              There are currently no items in the store catalogue. Keep an eye out for upcoming drops or cabin upgrade availabilities!
            </p>
          </div>
        )}

        {/* Security / Safe checkout notes */}
        <div className="max-w-xl mx-auto text-center py-6 bg-plum/5 rounded-2xl border border-plum/5 flex items-center justify-center space-x-2.5">
          <ShieldCheck className="h-5 w-5 text-mint-green flex-shrink-0" />
          <span className="text-xs text-warm-black/70 font-sans font-medium">
            Checkout processing is handled securely via our partner checkout systems.
          </span>
        </div>

      </div>
    </div>
  );
}
