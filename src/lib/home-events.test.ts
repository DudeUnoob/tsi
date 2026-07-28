import { describe, expect, it } from 'vitest';
import type { Event } from '@/lib/types';
import { getActiveHomepageEvents } from '@/lib/home-events';

const NOW = new Date('2026-07-28T12:00:00.000Z');

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    title: 'Sanga Summit',
    slug: 'sanga-summit',
    category: 'retreat',
    age_range: '18–35',
    start_date: '2026-07-25',
    end_date: '2026-07-28',
    location: 'New Vrindaban',
    price: '$0',
    status: 'open',
    short_description: '',
    long_description: '',
    hero_image: '',
    gallery_images: [],
    featured_on_homepage: true,
    published: true,
    ...overrides,
  };
}

describe('getActiveHomepageEvents', () => {
  it('keeps published featured events through their final calendar day', () => {
    expect(getActiveHomepageEvents([event()], NOW)).toHaveLength(1);
  });

  it('keeps future, sold-out, and coming-soon featured events visible', () => {
    const events = [
      event({ id: 1, end_date: '2026-08-01' }),
      event({ id: 2, status: 'sold-out', end_date: '2026-08-02' }),
      event({ id: 3, status: 'coming-soon', end_date: '2026-08-03' }),
    ];

    expect(getActiveHomepageEvents(events, NOW).map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it.each([
    ['unpublished', { published: false }],
    ['not featured', { featured_on_homepage: false }],
    ['draft', { status: 'draft' as const }],
    ['past status', { status: 'past' as const }],
    ['closed', { status: 'closed' as const }],
    ['ended', { end_date: '2026-07-27' }],
    ['missing end date', { end_date: '' }],
    ['invalid end date', { end_date: '2026-02-30' }],
  ])('excludes %s events', (_, overrides) => {
    expect(getActiveHomepageEvents([event(overrides)], NOW)).toEqual([]);
  });

  it('returns an empty list when there are no eligible events', () => {
    expect(getActiveHomepageEvents([], NOW)).toEqual([]);
  });
});
