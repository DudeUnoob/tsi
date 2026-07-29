import React from 'react';
import type { Metadata } from 'next';
import { getCachedEvents as getEvents } from '@/lib/cached-data';
import EventsCatalog from '@/components/EventsCatalog';

export const revalidate = 300; // Cached; admin saves bust the tag via /api/revalidate
export const metadata: Metadata = {
  title: 'Events',
  description: 'Explore Sanga retreats, summits, camps, and community events for Vaishnava youth.',
  alternates: { canonical: 'https://www.sangainitiative.org/events' },
};

export default async function EventsPage() {
  const events = await getEvents();

  return <EventsCatalog events={events} />;
}
