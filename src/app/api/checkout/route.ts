import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSiteSettings, getProductInventory } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { items, customerEmail, customerName, shippingAddress, successUrl, cancelUrl } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Validate inventory stock level before processing checkout
    for (const item of items) {
      const invList = await getProductInventory(item.id);
      const sizeInv = invList.find(i => i.size.toUpperCase() === item.size.toUpperCase());
      const stock = sizeInv ? sizeInv.stock : 0;
      if (item.quantity > stock) {
        return NextResponse.json(
          { error: `Sorry, only ${stock} units of ${item.product_title} (${item.size}) are left in stock.` },
          { status: 400 }
        );
      }
    }

    // Retrieve secret keys (from env or Supabase site settings)
    const settings = await getSiteSettings();
    const secretKey = process.env.STRIPE_SECRET_KEY || settings.stripe_secret_key;

    if (!secretKey) {
      // If Stripe keys are not configured, return url: null to let frontend trigger mock checkout
      console.warn('Stripe checkout requested but STRIPE_SECRET_KEY is not configured. Falling back to Mock Checkout.');
      return NextResponse.json({ url: null });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acme' as any, // fallback/latest
    });

    const origin = new URL(request.url).origin;

    // Map cart items to Stripe Checkout line items
    const line_items = items.map((item: any) => {
      const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      const unitAmountInCents = Math.round(numericPrice * 100);

      // Handle absolute image URLs (Stripe requires fully-qualified URLs)
      let imageUrls: string[] = [];
      if (item.image) {
        imageUrls = [
          item.image.startsWith('http') 
            ? item.image 
            : `${origin}${item.image}`
        ];
      }

      // If a pre-configured price ID exists, we can use it.
      // Otherwise, we create price_data inline dynamically so it works out-of-the-box!
      if (item.stripe_price_id) {
        return {
          price: item.stripe_price_id,
          quantity: item.quantity,
        };
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.product_title} (${item.size})`,
            description: `Size Selection: ${item.size}`,
            images: imageUrls,
          },
          unit_amount: unitAmountInCents,
        },
        quantity: item.quantity,
      };
    });

    // Create session metadata to store shipping and sizing info for the webhook/dashboard
    const orderMetadata = {
      customerName,
      customerEmail,
      shippingAddress,
      orderItemsSummary: items
        .map((item: any) => `${item.product_title} x${item.quantity} (Size: ${item.size})`)
        .join(', ')
        .substring(0, 500) // metadata field limit is 500 chars per value
    };

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: customerEmail,
      metadata: orderMetadata,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      // Collect shipping address via Stripe direct if preferred,
      // but since we collect it in our form, we pass it in metadata.
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout API Route error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
