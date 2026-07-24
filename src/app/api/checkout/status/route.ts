import { NextResponse } from 'next/server';
import { checkoutManagementSchema } from '@/lib/commerce';
import { verifyCheckoutManagementToken } from '@/lib/checkout-token';
import { synchronizeCheckoutOrder } from '@/lib/commerce-server';
import { getStripe } from '@/lib/stripe-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const parsed = checkoutManagementSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid checkout status request.' }, { status: 400 });
    }
    const { checkoutAttemptId, token } = parsed.data;
    if (!verifyCheckoutManagementToken(checkoutAttemptId, token)) {
      return NextResponse.json({ error: 'Invalid checkout management token.' }, { status: 403 });
    }
    return NextResponse.json(
      await synchronizeCheckoutOrder(getStripe(), checkoutAttemptId, 'status'),
    );
  } catch (error) {
    console.error('Checkout status synchronization failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to retrieve checkout status.' },
      { status: 500 },
    );
  }
}
