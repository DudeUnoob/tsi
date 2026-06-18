import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducts } from '@/lib/supabase';
import ProductForm from '@/components/ProductForm';
import { ArrowLeft, Tag } from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const isAvailable = product.status === 'available';
  const isSoldOut = product.status === 'sold-out';

  return (
    <div className="bg-[#FFEFBF] min-h-screen py-6 font-sans text-[#1E1D1B] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6 w-full">
        
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#6E0B64] hover:text-[#E65C17] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Catalog
          </Link>
        </div>

        {/* Product Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-[#FFEFBF] rounded-3xl border border-[#6E0B64]/10 p-6 sm:p-8 shadow-sm">
          
          {/* Left Column: Image Display */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="relative h-[280px] sm:h-[360px] lg:h-[440px] w-full rounded-2xl bg-[#6E0B64]/5 border border-[#6E0B64]/10 overflow-hidden shadow-inner group">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.product_title}
                  fill
                  priority
                  className="object-cover group-hover:scale-102 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#6E0B64]/20">
                  <Tag className="h-24 w-24" />
                </div>
              )}

              {/* Status Tags */}
              {isSoldOut && (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black uppercase tracking-widest bg-[#E65C17] text-[#FFEFBF] rounded-full shadow shadow-black/10 select-none">
                  Sold Out
                </span>
              )}
              {!isAvailable && !isSoldOut && (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black uppercase tracking-widest bg-[#1E1D1B]/20 text-[#FFEFBF] rounded-full shadow shadow-black/10 select-none">
                  Unavailable
                </span>
              )}
            </div>
          </div>

          {/* Right Column: details & Purchase interface */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#E65C17] font-black bg-[#6E0B64]/5 py-0.5 px-3 rounded-full border border-[#6E0B64]/10 inline-block">
                Sanga Apparel & Accessories
              </span>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-[#6E0B64] leading-tight">
                {product.product_title}
              </h1>
              <p className="text-sm text-[#1E1D1B]/80 leading-relaxed font-sans font-light">
                {product.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#6E0B64]/10">
              {isAvailable ? (
                <ProductForm product={product} />
              ) : (
                <div className="space-y-4 bg-[#6E0B64]/5 p-6 rounded-2xl border border-[#6E0B64]/10">
                  <h3 className="font-display text-xl font-bold text-[#6E0B64]">
                    Item Currently Unavailable
                  </h3>
                  <p className="text-sm text-[#1E1D1B]/70 font-sans font-light leading-relaxed">
                    This item has sold out or is temporarily inactive in the shop. Keep an eye out for upcoming merch drops or announcements on our WhatsApp dashboard.
                  </p>
                  <Link
                    href="/store"
                    className="inline-block px-5 py-2.5 bg-[#6E0B64] text-[#FFEFBF] hover:bg-[#E65C17] hover:text-[#FFEFBF] font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    Back to Store
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
