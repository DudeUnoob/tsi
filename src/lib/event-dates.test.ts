import { describe, expect, it } from 'vitest';
import { parseEventDate } from './event-dates';

describe('parseEventDate', () => {
  it('treats date-only values as local calendar dates', () => {
    const date = parseEventDate('2026-07-30');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(30);
  });

  it('still accepts full timestamps', () => {
    expect(parseEventDate('2026-07-30T12:00:00Z').toISOString())
      .toBe('2026-07-30T12:00:00.000Z');
  });
});
