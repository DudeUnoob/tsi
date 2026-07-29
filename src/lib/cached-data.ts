import { unstable_cache } from 'next/cache';
import {
  getEvents,
  getProductInventory,
  getProducts,
  getResources,
  getSiteSettings,
} from '@/lib/firebase';
import type {
  Event,
  ProductInventory,
  Resource,
  SiteSettings,
  StoreProduct,
} from '@/lib/types';

/**
 * Cached wrappers around the Firestore readers.
 *
 * Every public page previously set `revalidate = 0`, so each visitor paid for a
 * fresh set of Firestore round trips before the first byte was sent. These
 * wrappers let pages render from the cache instead, and admin edits stay
 * immediate because `/api/revalidate` busts the matching tag on save.
 *
 * Checkout and inventory reservation deliberately do NOT go through here —
 * `commerce-server.ts` talks to `firebase-admin` directly and transactionally,
 * so stock is always committed against live data.
 */

import { CACHE_TAGS } from '@/lib/cache-tags';

export { CACHE_TAGS };
export type { CacheTag } from '@/lib/cache-tags';

/** Editorial content: safe to hold for a while, and busted on admin save. */
const CONTENT_REVALIDATE_SECONDS = 300;

/** Stock counts are only a display hint, but should still turn over quickly. */
const INVENTORY_REVALIDATE_SECONDS = 30;

export const getCachedSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => getSiteSettings(),
  ['site-settings'],
  { tags: [CACHE_TAGS.siteSettings], revalidate: CONTENT_REVALIDATE_SECONDS },
);

export const getCachedEvents = unstable_cache(
  async (options?: { featuredOnly?: boolean; all?: boolean }): Promise<Event[]> =>
    getEvents(options),
  ['events'],
  { tags: [CACHE_TAGS.events], revalidate: CONTENT_REVALIDATE_SECONDS },
);

export async function getCachedEventBySlug(slug: string): Promise<Event | undefined> {
  const events = await getCachedEvents();
  return events.find(event => event.slug === slug);
}

export const getCachedProducts = unstable_cache(
  async (options?: { featuredOnly?: boolean; all?: boolean }): Promise<StoreProduct[]> =>
    getProducts(options),
  ['products'],
  { tags: [CACHE_TAGS.products], revalidate: CONTENT_REVALIDATE_SECONDS },
);

export const getCachedResources = unstable_cache(
  async (options?: { publishedOnly?: boolean }): Promise<Resource[]> =>
    getResources(options),
  ['resources'],
  { tags: [CACHE_TAGS.resources], revalidate: CONTENT_REVALIDATE_SECONDS },
);

export const getCachedProductInventory = unstable_cache(
  async (productId: number): Promise<ProductInventory[]> => getProductInventory(productId),
  ['product-inventory'],
  { tags: [CACHE_TAGS.inventory], revalidate: INVENTORY_REVALIDATE_SECONDS },
);
