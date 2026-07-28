import React from 'react';
import { getSiteSettings, getEvents } from '@/lib/firebase';
import { getActiveHomepageEvents } from '@/lib/home-events';
import HomeClient from '@/components/HomeClient';

export const revalidate = 0; // Ensure live data updates from database edits

export default async function HomePage() {
  const settings = await getSiteSettings();
  const events = getActiveHomepageEvents(
    await getEvents({ featuredOnly: true }),
    new Date(),
  );

  return <HomeClient settings={settings} events={events} />;
}
