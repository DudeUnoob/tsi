import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  applySessionTransition,
  markPaymentRefunded,
} from '@/lib/commerce-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');

  if (!secretKey || !webhookSecret || !signature) {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 400 });
  }

  const stripe = new Stripe(secretKey, { maxNetworkRetries: 2 });

  try {
    const event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await applySessionTransition(
          event.id,
          session,
          session.payment_status === 'paid' ? 'paid' : 'processing',
        );
        break;
      }
      case 'checkout.session.async_payment_succeeded':
        await applySessionTransition(event.id, event.data.object, 'paid');
        break;
      case 'checkout.session.async_payment_failed':
        await applySessionTransition(event.id, event.data.object, 'failed');
        break;
      case 'checkout.session.expired':
        await applySessionTransition(event.id, event.data.object, 'expired');
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 400 });
  }
}
