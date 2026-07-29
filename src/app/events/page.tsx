import React from 'react';
import type { Metadata } from 'next';
import { getEvents } from '@/lib/firebase';
import EventsCatalog from '@/components/EventsCatalog';

export const revalidate = 0;
export const metadata: Metadata = {
  title: 'Events',
  description: 'Explore Sanga retreats, summits, camps, and community events for Vaishnava youth.',
  alternates: { canonical: 'https://www.sangainitiative.org/events' },
};

export default async function EventsPage() {
  const events = await getEvents();

  return <EventsCatalog events={events} />;
}
