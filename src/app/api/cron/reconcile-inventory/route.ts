import { NextResponse } from 'next/server';
import { reconcileExpiredReservations } from '@/lib/commerce-server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    return NextResponse.json(await reconcileExpiredReservations());
  } catch (error) {
    console.error('Inventory reconciliation failed:', error);
    return NextResponse.json({ error: 'Reconciliation failed.' }, { status: 500 });
  }
}
