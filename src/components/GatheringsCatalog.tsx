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
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#66CC6E] text-[#1E1D1B] rounded-full border border-[#008030]/10 shadow-sm">
            Open
          </span>
        );
      case 'coming-soon':
        return (
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#FFA526] text-[#6E0B64] rounded-full border border-[#E65C17]/10 animate-pulse shadow-sm">
            Coming Soon
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#1E1D1B]/20 text-[#1E1D1B]/60 rounded-full border border-[#1E1D1B]/10">
            Closed
          </span>
        );
      case 'sold-out':
        return (
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#E65C17] text-[#FFEFBF] rounded-full shadow-sm">
            Sold Out
          </span>
        );
      case 'past':
        return (
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#1E1D1B]/10 text-[#1E1D1B]/50 rounded-full">
            Past
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'retreat':
        return 'Retreats';
      case 'camp':
        return 'Camps';
      case 'trip':
        return 'Trips';
      case 'talk':
        return 'Talks';
      case 'online':
        return 'Online';
      default:
        return 'Events';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-[#1E1D1B] font-sans">
      
      {/* Header Folds */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="text-xs uppercase tracking-widest text-[#E65C17] font-black font-sans bg-[#6E0B64]/5 py-1.5 px-4 rounded-full border border-[#6E0B64]/10">
          Our Gatherings
        </span>
        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-[#6E0B64] leading-tight">
          Shared Experiences
        </h1>
        <p className="text-base sm:text-lg text-[#1E1D1B]/75 leading-relaxed font-sans font-light">
          Come for the experience, stay for the people. We host retreats, local regional camps, pilgrimages, and digital discussions throughout the year.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-16 border-b border-[#6E0B64]/10 pb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-6 py-3 rounded-full font-sans text-xs uppercase tracking-widest font-black transition-all duration-200 cursor-pointer shadow-sm active:scale-97 ${
              activeTab === cat.id
                ? 'bg-[#6E0B64] text-[#FFEFBF] shadow-[#6E0B64]/20 shadow-md scale-102'
                : 'bg-[#FFEFBF] border border-[#6E0B64]/15 text-[#6E0B64] hover:bg-[#6E0B64]/5'
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
                className="group flex flex-col bg-[#FFEFBF] rounded-3xl border border-[#6E0B64]/10 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Wavy Arched Category Header */}
                <div className="relative bg-[#6E0B64] text-[#FFEFBF] py-4 text-center select-none overflow-hidden">
                  <span className="font-display text-lg font-bold uppercase tracking-widest relative z-10">
                    {getCategoryLabel(event.category)}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="relative block w-full h-4 fill-[#FFEFBF]">
                      <path d="M0,80 C150,150 350,0 500,80 L500,150 L0,150 Z" />
                    </svg>
                  </div>
                </div>

                {/* Image Wrap */}
                <div className="relative h-56 w-full bg-[#6E0B64]/5 overflow-hidden">
                  {event.hero_image ? (
                    <Image 
                      src={event.hero_image} 
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#6E0B64]/5">
                      <Calendar className="h-10 w-10 text-[#6E0B64]/20" />
                    </div>
                  )}
                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4">
                    {getStatusBadge(event.status)}
                  </div>
                  {/* Age Tag */}
                  {event.age_range && (
                    <span className="absolute top-4 right-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-[#FF7DB4] text-[#1E1D1B] rounded-full shadow-sm">
                      Ages {event.age_range}
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="flex-grow p-6 flex flex-col justify-between space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-black text-[#6E0B64] group-hover:text-[#E65C17] transition-colors mb-3 leading-tight">
                      {event.title}
                    </h2>
                    
                    <div className="space-y-2 text-xs text-[#1E1D1B]/60 font-sans font-bold uppercase tracking-wider mb-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-[#E65C17]" />
                        {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-[#E65C17]" />
                        {event.location}
                      </div>
                    </div>

                    <p className="text-sm text-[#1E1D1B]/85 leading-relaxed font-sans font-light line-clamp-3 mb-6">
                      {event.short_description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#6E0B64]/5 mt-auto">
                    <span className="text-sm font-black text-[#6E0B64] font-sans">
                      {event.price}
                    </span>
                    <Link 
                      href={`/gatherings/${event.slug}`}
                      className="inline-flex items-center text-xs font-black uppercase tracking-widest text-[#6E0B64] group-hover:text-[#E65C17] transition-colors gap-1"
                    >
                      View Details <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              layout
              className="col-span-1 md:col-span-3 text-center py-24 bg-[#6E0B64]/5 rounded-3xl border border-dashed border-[#6E0B64]/15"
            >
              <Users className="mx-auto h-12 w-12 text-[#6E0B64]/25 mb-4" />
              <h3 className="font-display text-2xl font-bold text-[#6E0B64] mb-2">No Gatherings Found</h3>
              <p className="text-sm text-[#1E1D1B]/60 max-w-sm mx-auto font-sans font-light">
                We are currently planning more events. Check back soon or join our WhatsApp community to hear announcements first!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
