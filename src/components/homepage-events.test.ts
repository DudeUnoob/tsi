import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('homepage event presentation', () => {
  it('renders the complete upcoming-events section only when eligible events exist', () => {
    const source = readFileSync(new URL('./HomeClient.tsx', import.meta.url), 'utf8');
    const conditionalStart = source.indexOf('{events.length > 0 && (');
    const heading = source.indexOf('Upcoming Events');
    const conditionalEnd = source.indexOf(')}', heading);

    expect(conditionalStart).toBeGreaterThan(-1);
    expect(heading).toBeGreaterThan(conditionalStart);
    expect(conditionalEnd).toBeGreaterThan(heading);
  });

  it('uses Events language and canonical event routes', () => {
    const source = readFileSync(new URL('./HomeClient.tsx', import.meta.url), 'utf8');

    expect(source).toContain('View All Events');
    expect(source).toContain('href="/events"');
    expect(source).not.toContain('href="/gatherings"');
  });
});
