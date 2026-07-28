import React from 'react';
import { getEvents } from '@/lib/firebase';
import EventsCatalog from '@/components/EventsCatalog';

export const revalidate = 0;

export default async function EventsPage() {
  const events = await getEvents();

  return <EventsCatalog events={events} />;
}
