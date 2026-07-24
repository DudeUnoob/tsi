import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

function getCheckoutTokenSecret() {
  const configured = process.env.CHECKOUT_TOKEN_SECRET;
  if (configured) {
    if (configured.length < 32) {
      throw new Error('CHECKOUT_TOKEN_SECRET must be at least 32 characters.');
    }
    return configured;
  }

  // Keep existing local Stripe sandbox setups working while requiring a
  // dedicated secret in deployed environments.
  if (!process.env.VERCEL && process.env.STRIPE_WEBHOOK_SECRET) {
    if (process.env.STRIPE_WEBHOOK_SECRET.length < 32) {
      throw new Error('The local checkout-token fallback is too short.');
    }
    return process.env.STRIPE_WEBHOOK_SECRET;
  }

  throw new Error('CHECKOUT_TOKEN_SECRET is not configured.');
}

function signatureFor(orderId: string) {
  return createHmac('sha256', getCheckoutTokenSecret())
    .update(`checkout-management:v1:${orderId}`)
    .digest('base64url');
}

export function createCheckoutManagementToken(orderId: string) {
  return `v1.${signatureFor(orderId)}`;
}

export function verifyCheckoutManagementToken(orderId: string, token: string) {
  const expected = createCheckoutManagementToken(orderId);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  return expectedBuffer.length === tokenBuffer.length
    && timingSafeEqual(expectedBuffer, tokenBuffer);
}
