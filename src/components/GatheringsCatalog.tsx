'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Event } from '@/lib/mockData';

interface GatheringsCatalogProps {
  events: Event[];
}

const categories = [
  { id: 'all', label: 'All Gatherings' },
  { id: 'retreat', label: 'Retreats' },
  { id: 'camp', label: 'Camps' },
  { id: 'trip', label: 'Trips' },
  { id: 'talk', label: 'Talks' },
  { id: 'online', label: 'Online' },
  { id: 'past', label: 'Past Events' }
];

export default function GatheringsCatalog({ events }: GatheringsCatalogProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredEvents = events.filter((event) => {
    // Past tab logic: status = 'past' or dates in the past
    if (activeTab === 'past') {
      return event.status === 'past';
    }
    
    // Regular tabs logic: filter out past events by default
    if (event.status === 'past') {
      return false;
    }
    
    if (activeTab === 'all') {
      return true;
    }
    
    return event.category === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-mint-green text-warm-black rounded-full border border-grass-green/10">
            Open
          </span>
        );
      case 'coming-soon':
        return (
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-sunshine text-warm-black rounded-full border border-tangerine/10 animate-pulse">
            Coming Soon
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-warm-black/20 text-warm-black/60 rounded-full border border-warm-black/10">
            Closed
          </span>
        );
      case 'sold-out':
        return (
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-tangerine text-linen rounded-full">
            Sold Out
          </span>
        );
      case 'past':
        return (
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-warm-black/10 text-warm-black/50 rounded-full">
            Past
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      
      {/* Header Folds */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-wider text-tangerine font-bold font-sans">
          Our Gatherings
        </span>
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-plum mt-2 mb-6">
          Shared Experiences
        </h1>
        <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans">
          Come for the experience, stay for the people. We host retreats, local regional camps, pilgrimages, and digital discussions throughout the year.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12 border-b border-plum/5 pb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-5 py-2.5 rounded-full font-sans text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === cat.id
                ? 'bg-plum text-linen shadow-md'
                : 'bg-linen border border-plum/10 text-plum hover:bg-plum/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <motion.div
                layout
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="group flex flex-col bg-linen rounded-3xl border border-plum/10 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image Wrap */}
                <div className="relative h-56 w-full bg-plum/5 overflow-hidden">
                  {event.hero_image ? (
                    <Image 
                      src={event.hero_image} 
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-plum/5">
                      <Calendar className="h-10 w-10 text-plum/20" />
                    </div>
                  )}
                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4">
                    {getStatusBadge(event.status)}
                  </div>
                  {/* Age Tag */}
                  {event.age_range && (
                    <span className="absolute top-4 right-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-pink text-warm-black rounded-full shadow-sm">
                      {event.age_range}
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="flex-grow p-6 flex flex-col justify-between">
                  <div>
                    {/* Category Label */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tangerine mb-1 block">
                      {event.category}
                    </span>
                    <h2 className="font-display text-2xl font-bold text-plum group-hover:text-tangerine transition-colors mb-3">
                      {event.title}
                    </h2>
                    
                    <div className="space-y-2 text-xs text-warm-black/75 font-sans font-medium mb-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-plum/55" />
                        {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-plum/55" />
                        {event.location}
                      </div>
                    </div>

                    <p className="text-sm text-warm-black/75 leading-relaxed font-sans line-clamp-3 mb-6">
                      {event.short_description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-plum/5 mt-auto">
                    <span className="text-sm font-bold text-plum font-sans">
                      {event.price}
                    </span>
                    <Link 
                      href={`/gatherings/${event.slug}`}
                      className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-plum group-hover:text-tangerine transition-colors"
                    >
                      View Details <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              layout
              className="col-span-1 md:col-span-3 text-center py-20 bg-plum/5 rounded-3xl border border-dashed border-plum/15"
            >
              <Users className="mx-auto h-12 w-12 text-plum/25 mb-4" />
              <h3 className="font-display text-xl font-bold text-plum mb-2">No Gatherings Found</h3>
              <p className="text-sm text-warm-black/60 max-w-sm mx-auto font-sans">
                We are currently planning more events. Check back soon or join our WhatsApp community to hear announcements first!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
