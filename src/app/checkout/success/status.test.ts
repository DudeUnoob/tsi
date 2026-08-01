import { describe, expect, it } from 'vitest';
import {
  isAuthoritativeCheckoutSuccess,
  isTerminalCheckoutFailure,
} from './status';

describe('checkout success verification states', () => {
  it.each(['paid', 'processing'])(
    'treats %s as authoritative enough to clear the matching cart',
    (paymentStatus) => {
      expect(isAuthoritativeCheckoutSuccess({
        paymentStatus,
        status: 'complete',
      })).toBe(true);
    },
  );

  it('does not treat a pending session as successful', () => {
    expect(isAuthoritativeCheckoutSuccess({
      paymentStatus: 'pending',
      status: 'open',
    })).toBe(false);
  });

  it('stops polling failed, refunded, and expired checkouts', () => {
    expect(isTerminalCheckoutFailure({
      paymentStatus: 'failed',
      status: 'complete',
    })).toBe(true);
    expect(isTerminalCheckoutFailure({
      paymentStatus: 'refunded',
      status: 'complete',
    })).toBe(true);
    expect(isTerminalCheckoutFailure({
      paymentStatus: 'pending',
      status: 'expired',
    })).toBe(true);
  });
});
