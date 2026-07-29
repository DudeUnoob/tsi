import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { CACHE_TAGS } from '@/lib/cache-tags';
import {
  archiveCommerceProduct,
  listAdminCommerce,
  reconcileExpiredReservations,
  retryInventoryAllocation,
  saveCommerceProduct,
  updateOrderFulfillment,
} from '@/lib/commerce-server';
import { requireAdmin } from '@/lib/admin-auth';
import { CURRENCY } from '@/lib/commerce';
import { getStripe } from '@/lib/stripe-server';

export const runtime = 'nodejs';

const productSchema = z.object({
  id: z.number().int().positive(),
  product_title: z.string().trim().min(1).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000),
  image: z.string().trim().max(2048),
  price_cents: z.number().int().nonnegative(),
  currency: z.literal(CURRENCY),
  variant_type: z.enum(['size', 'one_size']),
  status: z.enum(['available', 'unavailable']),
  featured: z.boolean(),
  published: z.boolean(),
});

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('save_product'),
    product: productSchema,
    inventory: z.array(z.object({
      variant: z.string().trim().min(1).max(32),
      on_hand: z.number().int().nonnegative(),
    })).min(1).max(20),
  }),
  z.object({
    action: z.literal('archive_product'),
    productId: z.number().int().positive(),
  }),
  z.object({
    action: z.literal('update_fulfillment'),
    orderId: z.string().min(1).max(128),
    fulfillmentStatus: z.enum(['unfulfilled', 'processing', 'shipped', 'completed', 'cancelled']),
    carrier: z.string().max(120),
    trackingNumber: z.string().max(200),
  }),
  z.object({
    action: z.literal('reconcile'),
  }),
  z.object({
    action: z.literal('resolve_inventory_exception'),
    orderId: z.string().min(1).max(128),
  }),
]);

/**
 * The store pages read products and stock from the tagged ISR cache, so any
 * write here has to invalidate those tags or the catalogue shows stale stock.
 * `expire: 0` makes the next request re-read rather than serving stale data.
 */
function bustCommerceCache() {
  // Non-fatal: the write already succeeded, so a cache hiccup must not turn a
  // completed admin action into a 500 that invites a duplicate retry.
  try {
    revalidateTag(CACHE_TAGS.products, { expire: 0 });
    revalidateTag(CACHE_TAGS.inventory, { expire: 0 });
  } catch (error) {
    console.warn('Commerce cache revalidation failed:', error);
  }
}

function authError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  return null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await listAdminCommerce());
  } catch (error) {
    return authError(error) || NextResponse.json({ error: 'Unable to load commerce data.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid commerce update.' }, { status: 400 });
    }

    const payload = parsed.data;
    if (payload.action === 'save_product') {
      await saveCommerceProduct(actor, payload.product, payload.inventory);
    } else if (payload.action === 'archive_product') {
      await archiveCommerceProduct(actor, payload.productId);
    } else if (payload.action === 'update_fulfillment') {
      await updateOrderFulfillment(
        actor,
        payload.orderId,
        payload.fulfillmentStatus,
        payload.carrier,
        payload.trackingNumber,
      );
    } else if (payload.action === 'reconcile') {
      const result = await reconcileExpiredReservations(getStripe());
      bustCommerceCache();
      return NextResponse.json(result);
    } else {
      const result = await retryInventoryAllocation(getStripe(), payload.orderId, actor);
      bustCommerceCache();
      return NextResponse.json(result);
    }

    bustCommerceCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin commerce update failed:', error);
    return authError(error) || NextResponse.json({ error: 'Commerce update failed.' }, { status: 500 });
  }
}
