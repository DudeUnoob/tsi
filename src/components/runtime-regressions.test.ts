import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('runtime regressions', () => {
  it('keeps public gathering detail reads constrained to published events', () => {
    const source = readSource('../lib/firebase.ts');
    const start = source.indexOf('export async function getEventBySlug');
    const end = source.indexOf('export async function getProducts', start);
    const implementation = source.slice(start, end);

    expect(implementation).toContain('getEvents()');
    expect(implementation).not.toContain('all: true');
  });

  it('uses valid SVG numeric syntax and bypasses optimization for Firebase Storage images', () => {
    const source = readSource('./HomeClient.tsx');

    expect(source).not.toContain('−');
    expect(source).toContain("hostname === 'firebasestorage.googleapis.com'");
    expect(source).toContain('unoptimized={shouldBypassImageOptimization');
  });

  it('keeps store cards within the single-column mobile grid', () => {
    const source = readSource('../app/store/page.tsx');

    expect(source).toContain('col-span-1 md:col-span-8');
    expect(source).toContain('col-span-1 md:col-span-4');
    expect(source).not.toContain('col-span-12 md:col-span');
  });

  it('does not expose the retired simulated card-payment order action', () => {
    const source = readSource('../app/actions/public.ts');

    expect(source).not.toContain('createOrderAction');
    expect(source).not.toContain('createOrder(');
  });
});
