import React from 'react';
import { getEvents } from '@/lib/firebase';
import GatheringsCatalog from '@/components/GatheringsCatalog';

export const revalidate = 0;

export default async function GatheringsPage() {
  const events = await getEvents();

  return <GatheringsCatalog events={events} />;
}
