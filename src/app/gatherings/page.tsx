import React from 'react';
import { getEvents } from '@/lib/supabase';
import GatheringsCatalog from '@/components/GatheringsCatalog';

export const revalidate = 0;

export default async function GatheringsPage() {
  const events = await getEvents({ publishedOnly: true });

  return <GatheringsCatalog events={events} />;
}
