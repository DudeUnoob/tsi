import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getProducts } from '@/lib/supabase';
import { ShoppingBag, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const revalidate = 0;

export default async function StorePage() {
  const products = await getProducts();

  return (
    <div className="bg-linen min-h-screen py-16 font-sans text-warm-black">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-pink font-black font-sans bg-plum/5 py-1.5 px-4 rounded-full border border-plum/10">
            Sanga Merch
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-plum">
            Merchandise & Cabin Upgrades
          </h1>
          <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans font-light">
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
                  className="group flex flex-col bg-[#FFEFBF] rounded-3xl border border-[#6E0B64]/10 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image wrapper */}
                  <Link 
                    href={`/store/${product.slug}`}
                    className="relative h-64 w-full bg-[#6E0B64]/5 overflow-hidden block"
                  >
                    {product.image ? (
                      <Image 
                        src={product.image} 
                        alt={product.product_title}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6E0B64]/20">
                        <ShoppingBag className="h-12 w-12" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {isSoldOut && (
                      <span className="absolute top-4 left-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-[#E65C17] text-[#FFEFBF] rounded-full shadow-sm select-none">
                        Sold Out
                      </span>
                    )}
                    {!isAvailable && !isSoldOut && (
                      <span className="absolute top-4 left-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-[#1E1D1B]/25 text-[#FFEFBF] rounded-full shadow-sm select-none">
                        Unavailable
                      </span>
                    )}
                  </Link>

                  {/* Description Box */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <h2 className="font-display text-2xl font-bold text-[#6E0B64] group-hover:text-[#E65C17] transition-colors leading-tight">
                        <Link href={`/store/${product.slug}`}>
                          {product.product_title}
                        </Link>
                      </h2>
                      <p className="text-sm text-[#1E1D1B]/80 leading-relaxed font-sans font-light line-clamp-3">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#6E0B64]/10 flex items-center justify-between mt-auto">
                      <span className="text-xl font-display font-black text-[#6E0B64]">
                        {product.price}
                      </span>
                      
                      {isAvailable ? (
                        <Link
                          href={`/store/${product.slug}`}
                          className="px-5 py-2.5 bg-[#6E0B64] text-[#FFEFBF] hover:bg-[#E65C17] hover:text-[#FFEFBF] font-black text-xs uppercase tracking-widest rounded-full shadow-md transition-all duration-200 inline-flex items-center gap-1 active:scale-97 cursor-pointer"
                        >
                          View Details <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="px-5 py-2.5 bg-[#1E1D1B]/5 border border-[#1E1D1B]/10 text-[#1E1D1B]/40 font-black text-xs uppercase tracking-widest rounded-full cursor-not-allowed select-none"
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
          <div className="text-center py-24 bg-[#6E0B64]/5 rounded-3xl border border-dashed border-[#6E0B64]/15 max-w-xl mx-auto mb-16">
            <ShoppingBag className="mx-auto h-12 w-12 text-[#6E0B64]/25 mb-4 animate-bounce" />
            <h3 className="font-display text-2xl font-bold text-[#6E0B64] mb-2">No Merch Available</h3>
            <p className="text-sm text-[#1E1D1B]/60 font-sans font-light">
              There are currently no items in the store catalogue. Keep an eye out for upcoming drops or cabin upgrade availabilities!
            </p>
          </div>
        )}

        {/* Security / Safe checkout notes */}
        <div className="max-w-xl mx-auto text-center py-4 px-6 bg-[#6E0B64]/5 rounded-2xl border border-[#6E0B64]/5 flex items-center justify-center space-x-2.5">
          <ShieldCheck className="h-5 w-5 text-[#66CC6E] flex-shrink-0" />
          <span className="text-xs text-[#1E1D1B]/75 font-sans font-bold">
            Checkout processing is handled securely via our partner checkout systems.
          </span>
        </div>

      </div>
    </div>
  );
}
