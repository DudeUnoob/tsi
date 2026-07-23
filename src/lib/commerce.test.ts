import { describe, expect, it } from 'vitest';
import {
  calculateQuoteTotals,
  cartRequestSchema,
  commitInventory,
  isVariantAllowed,
  legacyPriceToCents,
  releaseInventory,
  reserveInventory,
} from './commerce';

describe('commerce money', () => {
  it('migrates legacy display prices to integer cents', () => {
    expect(legacyPriceToCents('$45')).toBe(4500);
    expect(legacyPriceToCents('$19.99 USD')).toBe(1999);
  });

  it('adds one flat shipping charge to the quote', () => {
    expect(calculateQuoteTotals([
      { unit_amount: 4500, quantity: 2 },
      { unit_amount: 1500, quantity: 1 },
    ])).toEqual({
      subtotal_cents: 10500,
      shipping_cents: 500,
      total_cents: 11000,
    });
  });
});

describe('commerce inventory transitions', () => {
  const inventory = { on_hand: 5, reserved: 1, sold: 3 };

  it('reserves only available units', () => {
    expect(reserveInventory(inventory, 2)).toEqual({
      on_hand: 5,
      reserved: 3,
      sold: 3,
      available: 2,
    });
    expect(() => reserveInventory(inventory, 5)).toThrow('Only 4 units are available.');
  });

  it('releases a reservation without changing on-hand or sold counts', () => {
    expect(releaseInventory(inventory, 1)).toEqual({
      on_hand: 5,
      reserved: 0,
      sold: 3,
      available: 5,
    });
  });

  it('commits reserved inventory exactly once per transition', () => {
    expect(commitInventory(inventory, 1)).toEqual({
      on_hand: 4,
      reserved: 0,
      sold: 4,
      available: 4,
    });
  });
});

describe('cart validation', () => {
  it('normalizes variants and rejects invalid quantities', () => {
    expect(cartRequestSchema.parse({
      items: [{ productId: 1, variant: ' m ', quantity: 1 }],
    }).items[0].variant).toBe('M');
    expect(cartRequestSchema.safeParse({
      items: [{ productId: 1, variant: 'M', quantity: 0 }],
    }).success).toBe(false);
  });

  it('validates explicit apparel and one-size variants', () => {
    expect(isVariantAllowed('size', 'm')).toBe(true);
    expect(isVariantAllowed('size', 'OS')).toBe(false);
    expect(isVariantAllowed('one_size', 'OS')).toBe(true);
    expect(isVariantAllowed('one_size', 'M')).toBe(false);
  });
});
