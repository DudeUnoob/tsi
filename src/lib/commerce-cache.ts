import 'server-only';

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache-tags';

export type CommerceCacheScope = 'inventory' | 'products' | 'all';

/**
 * Keep cache invalidation next to the transactional write paths rather than in
 * individual callers. That way webhooks, reconciliation, checkout recovery,
 * and admin mutations cannot accidentally update Firestore while leaving the
 * public catalogue stale.
 *
 * Cache invalidation is deliberately best-effort. The durable Firestore write
 * has already succeeded by the time this runs, so a cache failure must not
 * turn a successful mutation into a retryable payment or admin error.
 */
export function invalidateCommerceCache(scope: CommerceCacheScope = 'inventory') {
  const tags = scope === 'all'
    ? [CACHE_TAGS.products, CACHE_TAGS.inventory]
    : [CACHE_TAGS[scope]];

  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch (error) {
      console.warn(`Commerce cache revalidation failed for "${tag}":`, error);
    }
  }
}
