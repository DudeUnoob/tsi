import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { CACHE_TAGS } from '@/lib/cache-tags';

export const runtime = 'nodejs';

const VALID_TAGS = Object.values(CACHE_TAGS) as [string, ...string[]];

const requestSchema = z.object({
  tags: z.array(z.enum(VALID_TAGS)).min(1).max(VALID_TAGS.length),
});

/**
 * Busts the cached public reads after an admin edit. Public pages are cached so
 * visitors never wait on Firestore; this endpoint is what keeps "edit in admin,
 * see it live" behaviour intact without reverting to `revalidate = 0`.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNAUTHORIZED';
    return NextResponse.json(
      { error: message },
      { status: message === 'FORBIDDEN' ? 403 : 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Expected { tags: string[] } with known cache tags' },
      { status: 400 },
    );
  }

  for (const tag of parsed.data.tags) {
    // `expire: 0` rather than the 'max' stale-while-revalidate profile: an admin
    // who just hit save must see the change on the very next request, which is
    // the guarantee the old `revalidate = 0` was there to provide.
    revalidateTag(tag, { expire: 0 });
  }

  return NextResponse.json({ revalidated: parsed.data.tags });
}
