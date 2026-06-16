# Future Stripe Checkout Integration Plan

Sanga currently uses external Squarespace/Stripe checkout links for registration, donations, and products. This document outlines the technical plan and code changes required to replace those external checkouts with **native Stripe Checkout** directly on this website when Sanga is ready.

---

## 1. Schema & Data Model Readiness

The database schemas and TypeScript interfaces in this project are already pre-configured with the necessary Stripe parameters:
- `stripe_price_id` (String: maps to specific event prices or recurring subscriptions)
- `stripe_product_id` (String: maps to store merchandise references)

You do not need to alter the database schemas when starting this integration.

---

## 2. Recommended Stack Additions

Run the following command in the project directory to install Stripe libraries:
```bash
npm install stripe @stripe/stripe-js
```

Add these keys to your `.env.local` file:
```bash
# Server-side Secret Key (keep private)
STRIPE_SECRET_KEY=sk_live_...
# Client-side Publishable Key (safe for frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# Webhook signing secret (obtained from Stripe CLI or Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 3. Creating the Session API Endpoint

Create a file named `src/app/api/checkout/route.ts` to handle session creations:

```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // or latest
});

export async function POST(request: Request) {
  try {
    const { priceId, successUrl, cancelUrl, customerEmail, mode = 'payment' } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode, // 'payment' for events/merch, 'subscription' for monthly donors
      customer_email: customerEmail,
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe session creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 4. Frontend Component Swap

On pages like `/gatherings/[slug]/page.tsx` and `/store/page.tsx`, replace the external HTML `<a>` links with dynamic buttons that trigger the API endpoint:

```typescript
// Example frontend handler in a React client component:
const handleCheckout = async (priceId: string) => {
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        successUrl: window.location.origin + '/checkout/success',
        cancelUrl: window.location.href,
        mode: 'payment' // Use 'subscription' for recurring donation products
      }),
    });
    
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url; // Redirect to secure Stripe page
    }
  } catch (err) {
    console.error('Failed to trigger Stripe checkout', err);
  }
};
```

---

## 5. Webhook listener for payment capture

To register successful payments, capture user contact info, and email registration tickets, set up a webhook receiver at `src/app/api/webhooks/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase'; // or admin supabase bypass client

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const email = session.customer_details?.email;
    const priceId = session.line_items?.data[0]?.price?.id;
    const name = session.customer_details?.name;

    console.log(`Payment confirmed for customer ${name} (${email})`);

    // TODO: Perform database inserts to register user for the matching event/product
    // e.g. await supabase.from('registrations').insert([...]);
  }

  return NextResponse.json({ received: true });
}
```
Register this webhook endpoint (`https://yourdomain.com/api/webhooks`) in the **Stripe Developer Dashboard** to listen for `checkout.session.completed` events.
