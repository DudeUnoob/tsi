import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  archiveCommerceProduct: vi.fn(),
  listAdminCommerce: vi.fn(),
  reconcileExpiredReservations: vi.fn(),
  restockOrder: vi.fn(),
  retryInventoryAllocation: vi.fn(),
  saveCommerceProduct: vi.fn(),
  updateOrderFulfillment: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/commerce-server', () => ({
  archiveCommerceProduct: mocks.archiveCommerceProduct,
  listAdminCommerce: mocks.listAdminCommerce,
  reconcileExpiredReservations: mocks.reconcileExpiredReservations,
  restockOrder: mocks.restockOrder,
  retryInventoryAllocation: mocks.retryInventoryAllocation,
  saveCommerceProduct: mocks.saveCommerceProduct,
  updateOrderFulfillment: mocks.updateOrderFulfillment,
}));
vi.mock('@/lib/admin-auth', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/stripe-server', () => ({ getStripe: vi.fn(() => ({})) }));

function patch(body: unknown) {
  return new Request('http://localhost/api/admin/commerce', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('admin commerce route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      uid: 'admin-1',
      email: 'admin@example.com',
    });
  });

  it('dispatches the explicit idempotent restock action', async () => {
    mocks.restockOrder.mockResolvedValue({
      applied: true,
      reason: 'restocked',
      restockedAt: '2030-01-01T00:00:00.000Z',
    });
    const { PATCH } = await import('./route');
    const response = await PATCH(patch({
      action: 'restock_order',
      orderId: 'order-123',
    }));

    expect(response.status).toBe(200);
    expect(mocks.restockOrder).toHaveBeenCalledWith(
      { uid: 'admin-1', email: 'admin@example.com' },
      'order-123',
    );
    expect(await response.json()).toMatchObject({
      applied: true,
      reason: 'restocked',
    });
  });

  it('accepts coming-soon as a server-authoritative product status', async () => {
    const { PATCH } = await import('./route');
    const response = await PATCH(patch({
      action: 'save_product',
      product: {
        id: 42,
        product_title: 'Hoodie',
        slug: 'hoodie',
        description: '',
        image: '/hoodie.png',
        price_cents: 5000,
        currency: 'usd',
        variant_type: 'size',
        status: 'coming-soon',
        featured: true,
        published: true,
      },
      inventory: [{ variant: 'M', on_hand: 0 }],
    }));

    expect(response.status).toBe(200);
    expect(mocks.saveCommerceProduct).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ status: 'coming-soon' }),
      [{ variant: 'M', on_hand: 0 }],
    );
  });
});
