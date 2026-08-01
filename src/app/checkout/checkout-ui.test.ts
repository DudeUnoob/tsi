import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('customer checkout navigation and verification', () => {
  it('opens Stripe in the current tab after recovery state is stored', () => {
    const source = readSource('../cart/page.tsx');
    const storedAttempt = source.lastIndexOf('storeActiveCheckout({');
    const navigation = source.indexOf('navigateToStripeCheckout(data.url)');

    expect(source).toContain('window.location.assign(url)');
    expect(source).not.toContain('window.open(');
    expect(storedAttempt).toBeGreaterThan(-1);
    expect(navigation).toBeGreaterThan(storedAttempt);
  });

  it('polls authoritative status and offers retry without clearing another cart', () => {
    const source = readSource('./success/page.tsx');

    expect(source).toContain('MAX_VERIFICATION_ATTEMPTS');
    expect(source).toContain('isAuthoritativeCheckoutSuccess(data)');
    expect(source).toContain('shouldClearCartAfterCheckout(activeCheckout, data.id)');
    expect(source).toContain('Retry Verification');
    expect(source).toContain("cache: 'no-store'");
  });
});
