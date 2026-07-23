import { NextResponse } from 'next/server';
import { cartRequestSchema } from '@/lib/commerce';
import { quoteCart } from '@/lib/commerce-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const parsed = cartRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'The cart contains invalid items.' },
        { status: 400 },
      );
    }
    return NextResponse.json(await quoteCart(parsed.data.items));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to quote the cart.' },
      { status: 409 },
    );
  }
}
