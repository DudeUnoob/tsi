import React from 'react';
import { getCachedSiteSettings as getSiteSettings, getCachedEvents as getEvents } from '@/lib/cached-data';
import { getActiveHomepageEvents } from '@/lib/home-events';
import HomeClient from '@/components/HomeClient';

export const revalidate = 300; // Cached; admin saves bust the tag via /api/revalidate

export default async function HomePage() {
  const settings = await getSiteSettings();
  const events = getActiveHomepageEvents(
    await getEvents({ featuredOnly: true }),
    new Date(),
  );

  return <HomeClient settings={settings} events={events} />;
}
