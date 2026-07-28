'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { Event } from '@/lib/types';
import { parseEventDate } from '@/lib/event-dates';

interface EventsCatalogProps {
  events: Event[];
}

const categories = [
  { id: 'all', label: 'All Events' },
  { id: 'retreat', label: 'Retreats' },
  { id: 'camp', label: 'Camps' },
  { id: 'trip', label: 'Trips' },
  { id: 'talk', label: 'Talks' },
  { id: 'online', label: 'Online' },
  { id: 'past', label: 'Past Events' },
];

function statusBadge(status: Event['status']) {
  switch (status) {
    case 'open':
      return 'bg-[#66CC6E] text-[var(--color-warm-black)]';
    case 'coming-soon':
      return 'bg-[var(--color-sunshine)] text-[var(--color-plum)]';
    case 'sold-out':
      return 'bg-[var(--color-pink)] text-[var(--color-linen)]';
    case 'closed':
    case 'past':
    case 'draft':
      return 'bg-[var(--color-warm-black)]/15 text-[var(--color-warm-black)]/70';
  }
}

function statusLabel(status: Event['status']) {
  return status.replace('-', ' ');
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    retreat: 'Retreat',
    camp: 'Camp',
    trip: 'Trip',
    talk: 'Talk',
    online: 'Online',
    'mens-sanga': "Men's Sanga",
    'ladies-sanga': "Ladies' Sanga",
  };

  return labels[category] || 'Event';
}

function eventDate(event: Event) {
  const start = parseEventDate(event.start_date);
  const end = parseEventDate(event.end_date || event.start_date);
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startLabel} – ${endLabel}`;
}

export default function EventsCatalog({ events }: EventsCatalogProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredEvents = events.filter((event) => {
    if (event.published === false || event.status === 'draft') return false;
    if (activeTab === 'past') return event.status === 'past';
    if (event.status === 'past') return false;
    if (activeTab === 'all') return true;
    return event.category === activeTab;
  });

  return (
    <main className="min-h-screen bg-linen text-warm-black font-sans">
      <section className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="inline-flex text-xs uppercase tracking-widest text-pink font-black bg-plum/5 py-1.5 px-4 rounded-full border border-plum/10">
            Sanga Events
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-plum leading-tight">
            Shared Experiences
          </h1>
          <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-light">
            Come for the experience, stay for the people. Explore retreats, regional camps,
            pilgrimages, talks, and online events throughout the year.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-3 mb-12 border-b border-plum/10 pb-8"
          aria-label="Filter events"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveTab(category.id)}
              aria-pressed={activeTab === category.id}
              className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-black transition-all duration-200 cursor-pointer shadow-sm ${
                activeTab === category.id
                  ? 'bg-plum text-linen shadow-plum/20 shadow-md'
                  : 'bg-linen border border-plum/15 text-plum hover:bg-plum/5'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, index) => (
              <motion.article
                layout
                key={event.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="group flex flex-col glass rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-60 w-full bg-plum/5 overflow-hidden">
                  {event.hero_image ? (
                    <Image
                      src={event.hero_image}
                      alt={event.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      priority={index === 0}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-plum/5">
                      <Calendar className="h-12 w-12 text-plum/20" />
                    </div>
                  )}

                  <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
                    <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-plum text-linen rounded-full shadow-md">
                      {categoryLabel(event.category)}
                    </span>
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm ${statusBadge(event.status)}`}>
                      {statusLabel(event.status)}
                    </span>
                  </div>

                  {event.age_range && (
                    <span className="absolute top-4 right-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-pink text-warm-black rounded-full shadow-sm">
                      Ages {event.age_range}
                    </span>
                  )}
                </div>

                <div className="flex-grow p-7 flex flex-col">
                  <h2 className="font-display text-2xl font-black text-plum group-hover:text-pink transition-colors leading-tight">
                    {event.title}
                  </h2>

                  <div className="space-y-2 text-xs text-warm-black/60 font-bold uppercase tracking-wider my-5">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-pink flex-none" />
                      {eventDate(event)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-pink flex-none" />
                      {event.location}
                    </div>
                  </div>

                  <p className="text-sm text-warm-black/85 leading-relaxed font-light line-clamp-3 mb-6">
                    {event.short_description}
                  </p>

                  <div className="flex items-center justify-between gap-4 pt-5 border-t border-plum/10 mt-auto">
                    <span className="text-sm font-black text-plum">{event.price}</span>
                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex items-center text-xs font-black uppercase tracking-widest text-plum group-hover:text-pink transition-colors gap-1"
                    >
                      View Details
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-24 bg-plum/5 rounded-[2.5rem] border border-dashed border-plum/15">
            <Users className="mx-auto h-12 w-12 text-plum/25 mb-4" />
            <h2 className="font-display text-2xl font-bold text-plum mb-2">More events are on the way</h2>
            <p className="text-sm text-warm-black/60 max-w-sm mx-auto font-light">
              We&apos;re planning what comes next. Check back soon or join the Sanga community
              for announcements.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
