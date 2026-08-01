import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('coming-soon storefront controls', () => {
  it('keeps the exact hoodie slug featured and removes links from coming-soon cards', () => {
    const source = readSource('./page.tsx');

    expect(source).toContain("product.slug === 'sanga-hoodie'");
    expect(source).toContain('const canViewProduct = !isComingSoon');
    expect(source).toContain('aria-label={`${product.product_title} — Coming Soon`}');
    expect(source).toContain('{canViewProduct ? (');
    expect(source).toContain('{canPurchase ? (');
  });

  it('renders coming-soon details before considering the purchase form', () => {
    const source = readSource('./[slug]/page.tsx');
    const comingSoonBranch = source.indexOf('{isComingSoon ? (');
    const purchaseForm = source.indexOf('<ProductForm');

    expect(comingSoonBranch).toBeGreaterThan(-1);
    expect(purchaseForm).toBeGreaterThan(comingSoonBranch);
    expect(source.slice(comingSoonBranch, purchaseForm)).toContain('disabled');
    expect(source.slice(comingSoonBranch, purchaseForm)).toContain('Coming Soon');
  });
});
