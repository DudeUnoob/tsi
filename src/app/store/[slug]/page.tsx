import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCachedProductInventory as getProductInventory, getCachedProducts as getProducts } from '@/lib/cached-data';
import ProductForm from '@/components/ProductForm';
import { ArrowLeft, Tag } from 'lucide-react';
import { getProductAvailability } from '../product-availability';

export const revalidate = 60; // Shorter: reflects stock counts

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Prerenders the published product pages. `dynamicParams` stays at its default
 * of `true`, so a product added after the build still renders on demand.
 */
export async function generateStaticParams() {
  const products = await getProducts();
  return products
    .filter(product => Boolean(product.slug))
    .map(product => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find(item => item.slug === slug);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.product_title,
    description: product.description,
    alternates: {
      canonical: `https://www.sangainitiative.org/store/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const inventory = await getProductInventory(product.id);
  const {
    isAvailable,
    isComingSoon,
    isSoldOut,
    label: availabilityLabel,
  } = getProductAvailability(product.status, inventory);

  return (
    <div className="bg-linen min-h-screen py-6 font-sans text-warm-black flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6 w-full">

        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-plum hover:text-pink transition-colors group cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Catalog
          </Link>
        </div>

        {/* Product Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-linen rounded-3xl border border-plum/10 p-6 sm:p-8 shadow-sm">

          {/* Left Column: Image Display */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="relative h-[280px] sm:h-[360px] lg:h-[440px] w-full rounded-2xl bg-plum/5 border border-plum/10 overflow-hidden shadow-inner group">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.product_title}
                  fill
                  priority
                  className="object-cover group-hover:scale-102 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-plum/20">
                  <Tag className="h-24 w-24" />
                </div>
              )}

              {/* Status Tags */}
              {isSoldOut && (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black uppercase tracking-widest bg-pink text-linen rounded-full shadow shadow-black/10 select-none">
                  Sold Out
                </span>
              )}
              {!isAvailable && !isSoldOut && (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black uppercase tracking-widest bg-warm-black/20 text-linen rounded-full shadow shadow-black/10 select-none">
                  {availabilityLabel}
                </span>
              )}
              {isComingSoon && (
                <div className="absolute inset-0 flex items-center justify-center bg-plum/55 backdrop-blur-[2px]">
                  <span className="rounded-full border border-linen/40 bg-plum/90 px-7 py-3 font-display text-xl font-black uppercase tracking-widest text-linen shadow-xl">
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: details & Purchase interface */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-pink font-black bg-plum/5 py-0.5 px-3 rounded-full border border-plum/10 inline-block">
                Sanga Apparel & Accessories
              </span>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-plum leading-tight">
                {product.product_title}
              </h1>
              <p className="text-sm text-warm-black/80 leading-relaxed font-sans font-light">
                {product.description}
              </p>
            </div>

            <div className="pt-4 border-t border-plum/10">
              {isComingSoon ? (
                <div className="space-y-4 bg-sunshine/10 p-6 rounded-2xl border border-sunshine/30">
                  <h3 className="font-display text-xl font-bold text-plum">
                    Coming Soon
                  </h3>
                  <p className="text-sm text-warm-black/70 font-sans font-light leading-relaxed">
                    This item is not available to purchase yet. Check back for the next merchandise drop.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="inline-block px-5 py-2.5 bg-warm-black/5 border border-warm-black/10 text-warm-black/40 font-black text-xs uppercase tracking-widest rounded-xl cursor-not-allowed select-none"
                  >
                    Coming Soon
                  </button>
                </div>
              ) : isAvailable ? (
                <ProductForm product={product} inventory={inventory} />
              ) : (
                <div className="space-y-4 bg-plum/5 p-6 rounded-2xl border border-plum/10">
                  <h3 className="font-display text-xl font-bold text-plum">
                    Item Currently Unavailable
                  </h3>
                  <p className="text-sm text-warm-black/70 font-sans font-light leading-relaxed">
                    This item has sold out or is temporarily inactive in the shop. Keep an eye out for upcoming merch drops and community announcements.
                  </p>
                  <Link
                    href="/store"
                    className="inline-block px-5 py-2.5 bg-plum text-linen hover:opacity-90 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
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
