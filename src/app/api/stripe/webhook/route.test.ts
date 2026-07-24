import Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { applySessionTransition, markPaymentRefunded } = vi.hoisted(() => ({
  applySessionTransition: vi.fn(),
  markPaymentRefunded: vi.fn(),
}));

vi.mock('@/lib/commerce-server', () => ({
  applySessionTransition,
  markPaymentRefunded,
}));
vi.mock('@/lib/stripe-server', () => ({
  getStripe: () => new Stripe('sk_test_route_test'),
}));

const webhookSecret = 'whsec_route_test';

function signedRequest(event: object, signatureOverride?: string) {
  const payload = JSON.stringify(event);
  const signature = signatureOverride || Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': signature },
    body: payload,
  });
}

describe('Stripe webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_route_test';
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
  });

  it('verifies the raw body and dispatches a paid Checkout event', async () => {
    const event = {
      id: 'evt_paid',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_paid',
          object: 'checkout.session',
          payment_status: 'paid',
          status: 'complete',
        },
      },
    };
    const { POST } = await import('./route');
    const response = await POST(signedRequest(event));
    expect(response.status).toBe(200);
    expect(applySessionTransition).toHaveBeenCalledWith(
      'evt_paid',
      expect.objectContaining({ id: 'cs_test_paid' }),
      'paid',
      'stripe.webhook',
    );
  });

  it('rejects an invalid signature without processing the event', async () => {
    const { POST } = await import('./route');
    const response = await POST(signedRequest({
      id: 'evt_invalid',
      object: 'event',
      type: 'checkout.session.expired',
      data: { object: { id: 'cs_invalid', object: 'checkout.session' } },
    }, 'invalid'));
    expect(response.status).toBe(400);
    expect(applySessionTransition).not.toHaveBeenCalled();
  });

  it('rejects a signed payload that is not valid JSON', async () => {
    const payload = 'not-json';
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });
    const { POST } = await import('./route');
    const response = await POST(new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    }));
    expect(response.status).toBe(400);
    expect(applySessionTransition).not.toHaveBeenCalled();
  });

  it('returns a retryable server error when Firestore processing fails', async () => {
    applySessionTransition.mockRejectedValueOnce(new Error('temporary Firestore failure'));
    const { POST } = await import('./route');
    const response = await POST(signedRequest({
      id: 'evt_retry',
      object: 'event',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_retry',
          object: 'checkout.session',
          payment_status: 'unpaid',
          status: 'expired',
        },
      },
    }));
    expect(response.status).toBe(500);
  });
});
