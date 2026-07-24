import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCheckoutManagementToken } from '@/lib/checkout-token';

const { synchronizeCheckoutOrder } = vi.hoisted(() => ({
  synchronizeCheckoutOrder: vi.fn(),
}));

vi.mock('@/lib/commerce-server', () => ({ synchronizeCheckoutOrder }));
vi.mock('@/lib/stripe-server', () => ({ getStripe: () => ({}) }));

function request(path: string, checkoutAttemptId: string, token: string) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkoutAttemptId, token }),
  });
}

describe('checkout management routes', () => {
  const attemptId = 'f179d8f4-a422-4f23-bc97-2d3a281743d8';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CHECKOUT_TOKEN_SECRET = 'test-checkout-token-secret-that-is-long-enough';
  });

  it('rejects an invalid status token', async () => {
    const { POST } = await import('./status/route');
    const response = await POST(request('/api/checkout/status', attemptId, 'invalid-token-value'));
    expect(response.status).toBe(403);
    expect(synchronizeCheckoutOrder).not.toHaveBeenCalled();
  });

  it('returns only the checkout management state for a valid token', async () => {
    synchronizeCheckoutOrder.mockResolvedValueOnce({
      orderId: attemptId,
      sessionId: 'cs_test_status',
      sessionStatus: 'open',
      paymentStatus: 'pending',
      reservationStatus: 'reserved',
      expiresAt: '2030-01-01T00:00:00.000Z',
      url: 'https://checkout.stripe.test/session',
      inventoryException: false,
    });
    const { POST } = await import('./status/route');
    const response = await POST(request(
      '/api/checkout/status',
      attemptId,
      createCheckoutManagementToken(attemptId),
    ));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).not.toHaveProperty('customerEmail');
    expect(body).toMatchObject({ sessionStatus: 'open', reservationStatus: 'reserved' });
  });

  it('rejects an invalid cancellation token without contacting Stripe synchronization', async () => {
    const { POST } = await import('./cancel/route');
    const response = await POST(request(
      '/api/checkout/cancel',
      attemptId,
      'invalid-cancellation-token',
    ));
    expect(response.status).toBe(403);
    expect(synchronizeCheckoutOrder).not.toHaveBeenCalled();
  });

  it('returns the released state after Stripe confirms cancellation', async () => {
    synchronizeCheckoutOrder.mockResolvedValueOnce({
      orderId: attemptId,
      sessionId: 'cs_test_cancelled',
      sessionStatus: 'expired',
      paymentStatus: 'failed',
      reservationStatus: 'released',
      expiresAt: '2030-01-01T00:00:00.000Z',
      url: null,
      inventoryException: false,
    });
    const { POST } = await import('./cancel/route');
    const response = await POST(request(
      '/api/checkout/cancel',
      attemptId,
      createCheckoutManagementToken(attemptId),
    ));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      sessionStatus: 'expired',
      reservationStatus: 'released',
    });
  });

  it('refuses cancellation when Stripe reports payment processing', async () => {
    synchronizeCheckoutOrder.mockResolvedValueOnce({
      orderId: attemptId,
      sessionId: 'cs_test_processing',
      sessionStatus: 'complete',
      paymentStatus: 'processing',
      reservationStatus: 'reserved',
      expiresAt: '2030-01-01T00:00:00.000Z',
      url: null,
      inventoryException: false,
    });
    const { POST } = await import('./cancel/route');
    const response = await POST(request(
      '/api/checkout/cancel',
      attemptId,
      createCheckoutManagementToken(attemptId),
    ));
    expect(response.status).toBe(409);
  });
});
