import { NextResponse } from 'next/server';
import { cartRequestSchema } from '@/lib/commerce';
import {
  InventoryUnavailableError,
  quoteCart,
  reconcileExpiredReservationsForItems,
} from '@/lib/commerce-server';
import { getStripe } from '@/lib/stripe-server';

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
    try {
      return NextResponse.json(await quoteCart(parsed.data.items));
    } catch (error) {
      if (!(error instanceof InventoryUnavailableError)) throw error;
      // A missed expiration event must not leave a cart blocked. Stripe is
      // authoritative, so reconcile safely and retry the quote once.
      try {
        await reconcileExpiredReservationsForItems(getStripe(), parsed.data.items);
      } catch (reconciliationError) {
        console.error('Relevant quote reconciliation failed:', reconciliationError);
        throw error;
      }
      return NextResponse.json(await quoteCart(parsed.data.items));
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to quote the cart.' },
      { status: 409 },
    );
  }
}
