import React from 'react';
import { getSiteSettings, getEvents } from '@/lib/supabase';
import HomeClient from '@/components/HomeClient';

export const revalidate = 0; // Ensure live data updates from database edits

export default async function HomePage() {
  const settings = await getSiteSettings();
  const events = await getEvents({ publishedOnly: true });

  return <HomeClient settings={settings} events={events} />;
}
