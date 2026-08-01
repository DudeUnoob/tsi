import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_TAGS } from './cache-tags';

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag }));

describe('invalidateCommerceCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates only inventory for stock transitions', async () => {
    const { invalidateCommerceCache } = await import('./commerce-cache');
    invalidateCommerceCache('inventory');
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.inventory, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });

  it('invalidates product and inventory reads for catalogue changes', async () => {
    const { invalidateCommerceCache } = await import('./commerce-cache');
    invalidateCommerceCache('all');
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.products, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.inventory, { expire: 0 });
  });

  it('does not fail a durable write when cache invalidation throws', async () => {
    revalidateTag.mockImplementationOnce(() => {
      throw new Error('cache unavailable');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { invalidateCommerceCache } = await import('./commerce-cache');
    expect(() => invalidateCommerceCache('inventory')).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
