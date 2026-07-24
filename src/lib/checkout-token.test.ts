import { beforeEach, describe, expect, it } from 'vitest';
import {
  createCheckoutManagementToken,
  verifyCheckoutManagementToken,
} from './checkout-token';

describe('checkout management tokens', () => {
  beforeEach(() => {
    process.env.CHECKOUT_TOKEN_SECRET = 'test-checkout-token-secret-that-is-long-enough';
  });

  it('authenticates only the matching checkout attempt', () => {
    const token = createCheckoutManagementToken('attempt-one');
    expect(verifyCheckoutManagementToken('attempt-one', token)).toBe(true);
    expect(verifyCheckoutManagementToken('attempt-two', token)).toBe(false);
    expect(verifyCheckoutManagementToken('attempt-one', `${token}x`)).toBe(false);
  });

  it('rejects a weak server secret', () => {
    process.env.CHECKOUT_TOKEN_SECRET = 'too-short';
    expect(() => createCheckoutManagementToken('attempt-one')).toThrow(
      'at least 32 characters',
    );
  });
});
