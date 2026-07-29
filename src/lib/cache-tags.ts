/**
 * Cache tag names, kept in their own dependency-free module.
 *
 * The Stripe webhook and the admin commerce route need these constants to
 * invalidate cached reads. Importing them from `cached-data.ts` would pull the
 * Firebase Web SDK into those route bundles and slow their cold start — which
 * matters most on the webhook, where Stripe retries on a slow response.
 */
export const CACHE_TAGS = {
  siteSettings: 'site-settings',
  events: 'events',
  products: 'products',
  resources: 'resources',
  inventory: 'inventory',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
