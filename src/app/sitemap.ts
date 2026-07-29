import type { MetadataRoute } from 'next';
import { getCachedEvents as getEvents, getCachedProducts as getProducts } from '@/lib/cached-data';
import { CANONICAL_SITE_URL, primaryPages } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, products] = await Promise.all([getEvents(), getProducts()]);
  const now = new Date();

  return [
    ...primaryPages.map((route, index) => ({
      url: `${CANONICAL_SITE_URL}${route}`,
      lastModified: now,
      changeFrequency: index === 0 ? 'weekly' as const : 'monthly' as const,
      priority: index === 0 ? 1 : 0.8,
    })),
    ...events.map(event => ({
      url: `${CANONICAL_SITE_URL}/events/${event.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map(product => ({
      url: `${CANONICAL_SITE_URL}/store/${product.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
