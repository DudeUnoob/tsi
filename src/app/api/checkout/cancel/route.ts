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
      return NextResponse.json({ error: 'Invalid checkout cancellation request.' }, { status: 400 });
    }
    const { checkoutAttemptId, token } = parsed.data;
    if (!verifyCheckoutManagementToken(checkoutAttemptId, token)) {
      return NextResponse.json({ error: 'Invalid checkout management token.' }, { status: 403 });
    }
    const state = await synchronizeCheckoutOrder(getStripe(), checkoutAttemptId, 'cancel');
    if (state.reservationStatus === 'reserved') {
      return NextResponse.json(
        { error: 'This payment is already processing and cannot be cancelled.' },
        { status: 409 },
      );
    }
    return NextResponse.json(state);
  } catch (error) {
    console.error('Checkout cancellation failed:', error);
    return NextResponse.json(
      { error: 'Unable to cancel Checkout safely. The reservation remains active.' },
      { status: 503 },
    );
  }
}
