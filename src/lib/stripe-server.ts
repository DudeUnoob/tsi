import 'server-only';

import Stripe from 'stripe';

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured on the server.');
  }
  return new Stripe(key, { maxNetworkRetries: 2 });
}
