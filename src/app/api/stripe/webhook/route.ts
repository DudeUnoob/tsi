import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import Stripe from 'stripe';
import { CACHE_TAGS } from '@/lib/cache-tags';
import {
  applySessionTransition,
  markPaymentRefunded,
} from '@/lib/commerce-server';
import { getStripe } from '@/lib/stripe-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');

  if (!secretKey || !webhookSecret || !signature) {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await applySessionTransition(
          event.id,
          session,
          session.payment_status === 'paid' ? 'paid' : 'processing',
          'stripe.webhook',
        );
        break;
      }
      case 'checkout.session.async_payment_succeeded':
        await applySessionTransition(event.id, event.data.object, 'paid', 'stripe.webhook');
        break;
      case 'checkout.session.async_payment_failed':
        await applySessionTransition(event.id, event.data.object, 'failed', 'stripe.webhook');
        break;
      case 'checkout.session.expired':
        await applySessionTransition(event.id, event.data.object, 'expired', 'stripe.webhook');
        break;
      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntent = charge.payment_intent;
        const paymentIntentId = typeof paymentIntent === 'string'
          ? paymentIntent
          : paymentIntent?.id;
        // Partial refunds do not make the whole order "refunded", and inventory
        // is intentionally never restocked by payment events.
        if (charge.refunded && paymentIntentId) {
          await markPaymentRefunded(event.id, paymentIntentId);
        }
        break;
      }
      default:
        break;
    }

    // A completed or expired checkout moves stock, and the store pages read
    // their counts from the tagged cache — drop it so shoppers do not see
    // availability that a just-processed order already consumed.
    //
    // Deliberately non-fatal: the Firestore transition above has already been
    // committed, so failing the response here would make Stripe redeliver an
    // event we have processed. A briefly stale stock count is the lesser evil.
    try {
      revalidateTag(CACHE_TAGS.inventory, { expire: 0 });
    } catch (error) {
      console.warn('Inventory cache revalidation failed after webhook:', error);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
