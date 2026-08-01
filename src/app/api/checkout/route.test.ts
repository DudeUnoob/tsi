import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
  getStripe: vi.fn(),
}));

vi.mock('@/lib/stripe-server', () => ({ getStripe: mocks.getStripe }));
vi.mock('@/lib/commerce-server', () => ({
  attachStripeSession: vi.fn(),
  applySessionTransition: vi.fn(),
  InventoryUnavailableError: class InventoryUnavailableError extends Error {},
  ProductUnavailableError: class ProductUnavailableError extends Error {},
  reconcileExpiredReservationsForItems: vi.fn(),
  releaseReservation: vi.fn(),
  reserveOrder: vi.fn(),
  synchronizeCheckoutOrder: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({ getAdminDb: vi.fn() }));
vi.mock('@/lib/checkout-token', () => ({
  createCheckoutManagementToken: vi.fn(),
}));
vi.mock('@/lib/checkout-origin', () => ({ getCheckoutOrigin: vi.fn() }));

describe('checkout verification route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStripe.mockReturnValue({
      checkout: { sessions: { retrieve: mocks.retrieve } },
    });
  });

  it('returns a retryable response for transient Stripe verification errors', async () => {
    mocks.retrieve.mockRejectedValueOnce(new Error('Stripe temporarily unavailable'));
    const { GET } = await import('./route');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await GET(new Request(
      'http://localhost/api/checkout?session_id=cs_test_transient',
    ));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Checkout verification is temporarily unavailable. Please retry.',
    });
    error.mockRestore();
  });

  it('keeps a missing Stripe Session as a terminal not-found response', async () => {
    mocks.retrieve.mockRejectedValueOnce({ statusCode: 404 });
    const { GET } = await import('./route');
    const response = await GET(new Request(
      'http://localhost/api/checkout?session_id=cs_test_missing',
    ));
    expect(response.status).toBe(404);
  });

  it('returns a conflict for a server-authoritative unavailable product', async () => {
    const commerce = await import('@/lib/commerce-server');
    vi.mocked(commerce.reserveOrder).mockRejectedValueOnce(
      new commerce.ProductUnavailableError('Sanga Rebrand Hoodie is unavailable.'),
    );
    const { POST } = await import('./route');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await POST(new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkoutAttemptId: 'd267fccd-5ebc-489b-b4ca-126202296879',
        items: [{ productId: 1, variant: 'M', quantity: 1 }],
      }),
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'Sanga Rebrand Hoodie is unavailable.',
      attemptTerminal: true,
    });
    expect(commerce.reconcileExpiredReservationsForItems).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
