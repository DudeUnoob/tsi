import { describe, expect, it } from 'vitest';
import { getProductAvailability } from './product-availability';

describe('store product availability presentation', () => {
  it('gives coming-soon status precedence over zero inventory', () => {
    expect(getProductAvailability('coming-soon', [])).toEqual({
      isAvailable: false,
      isComingSoon: true,
      isSoldOut: false,
      label: 'Coming Soon',
    });
  });

  it('only labels an available product as sold out when every variant is empty', () => {
    expect(getProductAvailability('available', [
      { available: 0 },
      { available: 0 },
    ]).label).toBe('Sold Out');
    expect(getProductAvailability('available', [
      { available: 0 },
      { available: 1 },
    ]).label).toBe('Available');
  });

  it('keeps administratively unavailable products distinct from sold-out products', () => {
    expect(getProductAvailability('unavailable', [{ available: 0 }]).label)
      .toBe('Unavailable');
  });
});
