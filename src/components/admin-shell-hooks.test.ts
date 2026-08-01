import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function readComponent(name: string) {
  return readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');
}

function expectAdminReturnAfterHooks(source: string, hooks: string[]) {
  const adminReturn = source.indexOf("if (pathname?.startsWith('/admin'))");
  expect(adminReturn).toBeGreaterThan(-1);
  for (const hook of hooks) {
    expect(source.indexOf(hook)).toBeGreaterThan(-1);
    expect(source.indexOf(hook)).toBeLessThan(adminReturn);
  }
}

describe('admin route public chrome', () => {
  it('keeps the Header hook order stable before hiding it on admin routes', () => {
    expectAdminReturnAfterHooks(readComponent('Header.tsx'), [
      'usePathname()',
      'useState<string | null>(null)',
      'useCart()',
      'useTheme()',
    ]);
  });

  it('keeps the Footer hook order stable before hiding it on admin routes', () => {
    expectAdminReturnAfterHooks(readComponent('Footer.tsx'), [
      'usePathname()',
    ]);
  });
});
