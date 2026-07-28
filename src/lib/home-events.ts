import type { Event } from '@/lib/types';

const INACTIVE_EVENT_STATUSES: ReadonlySet<Event['status']> = new Set([
  'draft',
  'past',
  'closed',
]);

function toDateKey(value: string | Date): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  const dateKey = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dateKey
    ? null
    : dateKey;
}

export function getActiveHomepageEvents(events: Event[], now: Date = new Date()): Event[] {
  const today = toDateKey(now);
  if (!today) return [];

  return events.filter((event) => {
    const endDate = toDateKey(event.end_date);

    return Boolean(
      event.published
      && event.featured_on_homepage
      && !INACTIVE_EVENT_STATUSES.has(event.status)
      && endDate
      && endDate >= today
    );
  });
}
