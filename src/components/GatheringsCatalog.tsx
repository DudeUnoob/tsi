'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, MapPin, Users, ArrowRight, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
import { Event } from '@/lib/types';

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
  const [viewMode, setViewMode] = useState<'cards' | 'calendar' | 'list'>('cards');
  const [activeTab, setActiveTab] = useState('all');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date('2026-06-01')); // Start at June 2026
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Filter checkbox state for Calendar and List view
  const [calendarFilters, setCalendarFilters] = useState({
    retreats: true,
    mensSanga: true,
    ladiesSanga: true,
    heartspace: true,
    tsiEvents: true
  });

  const matchesFilter = (event: Event) => {
    const isRetreat = ['retreat', 'camp', 'trip'].includes(event.category);
    const isMensSanga = event.category === 'mens-sanga';
    const isLadiesSanga = event.category === 'ladies-sanga';
    const isHeartspace = event.category === 'online' && event.title.toLowerCase().includes('heartspace');
    const isTsiEvent = !isRetreat && !isMensSanga && !isLadiesSanga && !isHeartspace;

    if (isRetreat && calendarFilters.retreats) return true;
    if (isMensSanga && calendarFilters.mensSanga) return true;
    if (isLadiesSanga && calendarFilters.ladiesSanga) return true;
    if (isHeartspace && calendarFilters.heartspace) return true;
    if (isTsiEvent && calendarFilters.tsiEvents) return true;

    return false;
  };

  const filteredEventsForCards = events.filter((event) => {
    if (activeTab === 'past') {
      return event.status === 'past';
    }
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
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#66CC6E] text-[var(--color-warm-black)] rounded-full border border-[#008030]/10 shadow-sm">
            Open
          </span>
        );
      case 'coming-soon':
        return (
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[var(--color-sunshine)] text-[var(--color-plum)] rounded-full border border-[var(--color-pink)]/10 shadow-sm">
            Coming Soon
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[var(--color-warm-black)]/20 text-[var(--color-warm-black)]/60 rounded-full border border-[var(--color-warm-black)]/10">
            Closed
          </span>
        );
      case 'sold-out':
        return (
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[var(--color-pink)] text-[var(--color-linen)] rounded-full shadow-sm">
            Sold Out
          </span>
        );
      case 'past':
        return (
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[var(--color-warm-black)]/10 text-[var(--color-warm-black)]/50 rounded-full">
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
      case 'mens-sanga':
        return "Men's Sanga";
      case 'ladies-sanga':
        return "Ladies' Sanga";
      default:
        return 'Events';
    }
  };

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = [];
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(new Date(prevMonthYear, prevMonth, daysInPrevMonth - i));
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(new Date(year, month, i));
  }

  const nextMonthDays = [];
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = 42 - totalDaysSoFar;
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(new Date(nextMonthYear, nextMonth, i));
  }

  const allGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return events.filter(event => {
      if (event.published === false) return false;
      if (!matchesFilter(event)) return false;

      const startParts = event.start_date.split('-');
      const endParts = (event.end_date || event.start_date).split('-');
      const eventStart = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2])).getTime();
      const eventEnd = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2])).getTime();

      return dayStart >= eventStart && dayStart <= eventEnd;
    });
  };

  const getEventBadgeClass = (event: Event) => {
    const isRetreat = ['retreat', 'camp', 'trip'].includes(event.category);
    const isMensSanga = event.category === 'mens-sanga';
    const isLadiesSanga = event.category === 'ladies-sanga';
    const isHeartspace = event.category === 'online' && event.title.toLowerCase().includes('heartspace');

    if (isRetreat) return 'bg-plum text-linen border-plum/10';
    if (isMensSanga) return 'bg-plum text-linen border-plum/10';
    if (isLadiesSanga) return 'bg-pink text-plum border-pink/10';
    if (isHeartspace) return 'bg-sunshine text-plum border-sunshine/10';
    return 'bg-sunshine text-plum border-sunshine/10';
  };

  // Group events chronologically for List View
  const listEvents = events
    .filter(event => event.published !== false && matchesFilter(event))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const groupedListEvents: { [key: string]: Event[] } = {};
  listEvents.forEach(event => {
    const date = new Date(event.start_date + 'T00:00:00');
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groupedListEvents[monthYear]) {
      groupedListEvents[monthYear] = [];
    }
    groupedListEvents[monthYear].push(event);
  });

  const changeMonth = (offset: number) => {
    setCalendarDate(new Date(year, month + offset, 1));
  };

  const getTargetLink = (event: Event) => {
    if (['mens-sanga', 'ladies-sanga'].includes(event.category)) return '/community';
    return `/gatherings/${event.slug}`;
  };

  const getLinkText = (event: Event) => {
    if (['mens-sanga', 'ladies-sanga'].includes(event.category)) return 'Connect on WhatsApp';
    if (event.status === 'coming-soon') return 'Notify Me';
    return 'Register / View Details';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-warm-black font-sans">
      
      {/* Header Folds */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <span className="text-xs uppercase tracking-widest text-pink font-black font-sans bg-plum/5 py-1.5 px-4 rounded-full border border-plum/10">
          Our Gatherings
        </span>
        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-plum leading-tight">
          Shared Experiences
        </h1>
        <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans font-light">
          Come for the experience, stay for the people. We host retreats, local regional camps, pilgrimages, and digital discussions throughout the year.
        </p>
      </div>

      {/* Main View Switcher */}
      <div className="flex justify-center mb-10">
        <div className="bg-plum/5 p-1.5 rounded-full border border-plum/10 flex space-x-1 shadow-inner">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-plum text-linen shadow-md'
                : 'text-plum/70 hover:text-plum hover:bg-plum/5'
            }`}
          >
            <Grid className="h-3.5 w-3.5" /> Card View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-plum text-linen shadow-md'
                : 'text-plum/70 hover:text-plum hover:bg-plum/5'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" /> Calendar View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-plum text-linen shadow-md'
                : 'text-plum/70 hover:text-plum hover:bg-plum/5'
            }`}
          >
            <List className="h-3.5 w-3.5" /> List View
          </button>
        </div>
      </div>

      {/* VIEW MODES RENDERING */}
      {viewMode === 'cards' && (
        <>
          {/* Filter Tabs for Cards */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12 border-b border-plum/10 pb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-6 py-2.5 rounded-full font-sans text-xs uppercase tracking-widest font-black transition-all duration-200 cursor-pointer shadow-sm active:scale-97 ${
                  activeTab === cat.id
                    ? 'bg-plum text-linen shadow-plum/20 shadow-md scale-102'
                    : 'bg-linen border border-plum/15 text-plum hover:bg-plum/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {/* Cards Grid */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredEventsForCards.length > 0 ? (
                filteredEventsForCards.map((event, idx) => {
                  const isFeatured = idx === 0 && activeTab === 'all'; // Feature the first one on 'All' tab

                  if (isFeatured) {
                    return (
                      <motion.div
                        layout
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className="col-span-12 md:col-span-8 group flex flex-col md:flex-row glass rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative"
                      >
                        {/* Cover image */}
                        <div className="relative h-72 md:h-auto md:w-1/2 bg-plum/5 overflow-hidden block min-h-[320px]">
                          {event.hero_image ? (
                            <Image 
                              src={event.hero_image} 
                              alt={event.title}
                              fill
                              className="object-cover group-hover:scale-103 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-plum/5">
                              <CalendarIcon className="h-16 w-16 text-plum/20" />
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <span className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest bg-plum text-linen rounded-full shadow-md">
                              {getCategoryLabel(event.category)}
                            </span>
                            {getStatusBadge(event.status)}
                          </div>
                          
                          {event.age_range && (
                            <span className="absolute top-4 right-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-pink text-warm-black rounded-full shadow-sm">
                              Ages {event.age_range}
                            </span>
                          )}
                        </div>

                        {/* Content details */}
                        <div className="flex-grow p-8 flex flex-col justify-between md:w-1/2 space-y-6">
                          <div className="space-y-4">
                            <h2 className="font-display text-3xl font-black text-plum group-hover:text-pink transition-colors leading-tight">
                              {event.title}
                            </h2>
                            
                            <div className="space-y-2 text-xs text-warm-black/60 font-sans font-bold uppercase tracking-wider">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2 text-pink" />
                                {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date((event.end_date || event.start_date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-pink" />
                                {event.location}
                              </div>
                            </div>

                            <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                              {event.short_description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-plum/10 mt-auto">
                            <span className="text-base font-black text-plum font-sans">{event.price}</span>
                            <Link 
                              href={`/gatherings/${event.slug}`}
                              className="inline-flex items-center text-xs font-black uppercase tracking-widest text-plum group-hover:text-pink transition-colors gap-1.5 font-sans"
                            >
                              View Details <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      layout
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className="col-span-12 md:col-span-4 group flex flex-col glass rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Cover image */}
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
                            <CalendarIcon className="h-10 w-10 text-plum/20" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-plum text-linen rounded-full shadow-md">
                            {getCategoryLabel(event.category)}
                          </span>
                          {getStatusBadge(event.status)}
                        </div>

                        {event.age_range && (
                          <span className="absolute top-4 right-4 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-pink text-warm-black rounded-full shadow-sm">
                            Ages {event.age_range}
                          </span>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="flex-grow p-6 flex flex-col justify-between space-y-6">
                        <div>
                          <h2 className="font-display text-2xl font-black text-plum group-hover:text-pink transition-colors mb-3 leading-tight">
                            {event.title}
                          </h2>
                          
                          <div className="space-y-2 text-xs text-warm-black/60 font-sans font-bold uppercase tracking-wider mb-6">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-2 text-pink" />
                              {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date((event.end_date || event.start_date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-pink" />
                              {event.location}
                            </div>
                          </div>

                          <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light line-clamp-3 mb-6">
                            {event.short_description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-plum/10 mt-auto">
                          <span className="text-sm font-black text-plum font-sans">{event.price}</span>
                          <Link 
                            href={`/gatherings/${event.slug}`}
                            className="inline-flex items-center text-xs font-black uppercase tracking-widest text-plum group-hover:text-pink transition-colors gap-1 font-sans"
                          >
                            View Details <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-12 text-center py-24 bg-plum/5 rounded-[2.5rem] border border-dashed border-plum/15">
                  <Users className="mx-auto h-12 w-12 text-plum/25 mb-4" />
                  <h3 className="font-display text-2xl font-bold text-plum mb-2">No Gatherings Found</h3>
                  <p className="text-sm text-warm-black/60 max-w-sm mx-auto font-sans font-light">
                    We are currently planning more events. Check back soon or join our WhatsApp community to hear announcements first!
                  </p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {(viewMode === 'calendar' || viewMode === 'list') && (
        <div className="space-y-8 animate-fadeIn text-warm-black">
          
          {/* Calendar/List filters */}
          <div className="bg-plum/5 border border-plum/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-widest text-pink font-black">
              Filter Events By Type
            </span>
            <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider text-plum">
              {/* Retreats filter */}
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={calendarFilters.retreats}
                  onChange={(e) => setCalendarFilters({ ...calendarFilters, retreats: e.target.checked })}
                  className="h-4 w-4 rounded text-plum border-plum/20 focus:ring-sunshine"
                />
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-plum"></span> Retreats & Camps
                </span>
              </label>

              {/* Men's Sanga filter */}
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={calendarFilters.mensSanga}
                  onChange={(e) => setCalendarFilters({ ...calendarFilters, mensSanga: e.target.checked })}
                  className="h-4 w-4 rounded text-plum border-plum/20 focus:ring-sunshine"
                />
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-plum/80"></span> Men&apos;s Sanga
                </span>
              </label>

              {/* Ladies' Sanga filter */}
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={calendarFilters.ladiesSanga}
                  onChange={(e) => setCalendarFilters({ ...calendarFilters, ladiesSanga: e.target.checked })}
                  className="h-4 w-4 rounded text-plum border-plum/20 focus:ring-sunshine"
                />
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink"></span> Ladies&apos; Sanga
                </span>
              </label>

              {/* Heartspace filter */}
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={calendarFilters.heartspace}
                  onChange={(e) => setCalendarFilters({ ...calendarFilters, heartspace: e.target.checked })}
                  className="h-4 w-4 rounded text-plum border-plum/20 focus:ring-sunshine"
                />
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sunshine"></span> Heartspace
                </span>
              </label>

              {/* TSI Events filter */}
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={calendarFilters.tsiEvents}
                  onChange={(e) => setCalendarFilters({ ...calendarFilters, tsiEvents: e.target.checked })}
                  className="h-4 w-4 rounded text-plum border-plum/20 focus:ring-sunshine"
                />
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sunshine"></span> Other TSI Events
                </span>
              </label>
            </div>
          </div>

          {/* VIEW: Calendar Monthly Grid */}
          {viewMode === 'calendar' && (
            <div className="bg-linen border border-plum/10 rounded-[2rem] p-6 shadow-sm space-y-6">
              
              {/* Calendar Monthly Navigation Header */}
              <div className="flex items-center justify-between border-b border-plum/5 pb-4">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 hover:bg-plum/5 border border-plum/15 rounded-xl text-plum transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="font-display text-2xl font-black text-plum">
                  {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 hover:bg-plum/5 border border-plum/15 rounded-xl text-plum transition-all cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Calendar Grid wrapper */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-plum/60 border-b border-plum/5 pb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Monthly Days cells */}
              <div className="grid grid-cols-7 gap-2 min-h-[400px]">
                {allGridDays.map((dateDay, idx) => {
                  const isCurrentMonth = dateDay.getMonth() === month;
                  const dayEvents = getEventsForDay(dateDay);
                  const isToday = new Date().toDateString() === dateDay.toDateString();

                  return (
                    <div
                      key={idx}
                      className={`min-h-[75px] border border-plum/5 rounded-2xl p-2 flex flex-col justify-between transition-colors relative overflow-hidden bg-transparent ${
                        isCurrentMonth ? '' : 'opacity-40 bg-warm-black/2'
                      } ${isToday ? 'border-pink border-2 shadow-sm' : ''}`}
                    >
                      <span className={`text-[10px] font-sans font-black ${isToday ? 'text-pink bg-pink/10 w-5 h-5 rounded-full flex items-center justify-center self-end' : 'self-end text-plum/60'}`}>
                        {dateDay.getDate()}
                      </span>

                      {/* Day's Event Badges */}
                      <div className="space-y-1 mt-1 z-10">
                        {dayEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left truncate px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition-transform hover:scale-102 cursor-pointer shadow-sm ${getEventBadgeClass(event)}`}
                            title={event.title}
                          >
                            {event.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: Chronological List View */}
          {viewMode === 'list' && (
            <div className="space-y-12">
              {Object.keys(groupedListEvents).length > 0 ? (
                Object.keys(groupedListEvents).map(monthYear => (
                  <div key={monthYear} className="space-y-4 text-left">
                    <h3 className="font-display text-2xl font-black text-plum border-b border-plum/10 pb-2">
                      {monthYear}
                    </h3>
                    <div className="space-y-4">
                      {groupedListEvents[monthYear].map(event => (
                        <div
                          key={event.id}
                          className="bg-linen border border-plum/10 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow font-sans"
                        >
                          <div className="flex items-start space-x-5 flex-grow">
                            {/* Date Block */}
                            <div className="bg-plum text-linen p-3 rounded-2xl text-center min-w-[70px] shadow-sm flex-shrink-0">
                              <span className="block text-[10px] uppercase font-bold tracking-wider leading-none">
                                {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                              <span className="block text-2xl font-black tracking-tight leading-none mt-1">
                                {new Date(event.start_date + 'T00:00:00').getDate()}
                              </span>
                            </div>

                            {/* Info Block */}
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getEventBadgeClass(event)}`}>
                                  {getCategoryLabel(event.category)}
                                </span>
                                {event.age_range && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-pink/10 text-plum border border-pink/20 uppercase">
                                    Ages {event.age_range}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-lg font-black text-plum leading-snug">{event.title}</h4>
                              <div className="flex flex-wrap gap-4 text-xs font-bold text-plum/60 uppercase tracking-wide">
                                <span className="flex items-center"><CalendarIcon className="h-3.5 w-3.5 mr-1 text-pink" /> {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date((event.end_date || event.start_date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 text-pink" /> {event.location}</span>
                              </div>
                              <p className="text-sm text-warm-black/85 font-light leading-relaxed pt-1">{event.short_description}</p>
                            </div>
                          </div>

                          {/* CTA Row */}
                          <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-plum/5 min-w-[150px]">
                            <span className="text-base font-black text-plum">{event.price}</span>
                            <a
                              href={`/gatherings/${event.slug}`}
                              className="px-5 py-3 border border-plum hover:bg-plum/10 text-plum font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center text-nowrap"
                            >
                              View Full Details →
                            </a>
                            <a
                              href={getTargetLink(event)}
                              target={getTargetLink(event).startsWith('http') ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className="px-5 py-3 bg-plum hover:opacity-90 text-linen font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow active:scale-97 cursor-pointer text-center text-nowrap"
                            >
                              {getLinkText(event)}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 bg-[var(--color-plum)]/5 rounded-3xl border border-dashed border-[var(--color-plum)]/15 max-w-xl mx-auto px-6">
                  <Users className="mx-auto h-12 w-12 text-[var(--color-plum)]/25 mb-4" />
                  <h3 className="font-display text-2xl font-bold text-[var(--color-plum)] mb-2">No Matching Events</h3>
                  <p className="text-sm text-[var(--color-warm-black)]/60 max-w-sm mx-auto font-sans font-light">
                    Adjust your checkboxes at the top to filter retreats, Sanga circles, or monthly Heartspaces.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EVENT POPUP DETAILS MODAL OVERLAY */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-[var(--color-warm-black)]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 text-[var(--color-warm-black)] font-sans">
          <div className="max-w-md w-full bg-[var(--color-linen)] border border-[var(--color-plum)]/15 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header banner */}
            <div className="p-6 bg-[var(--color-plum)] text-[var(--color-linen)] flex items-center justify-between relative overflow-hidden select-none border-b border-[var(--color-plum)]/10">
              <div className="relative z-10 space-y-1 text-left">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getEventBadgeClass(selectedEvent)}`}>
                  {getCategoryLabel(selectedEvent.category)}
                </span>
                <h3 className="font-display text-xl font-bold text-white leading-tight">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-3xl text-[var(--color-linen)]/75 hover:text-white cursor-pointer relative z-10"
              >
                &times;
              </button>
              <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="relative block w-full h-3 fill-[var(--color-linen)]">
                  <path d="M0,80 C150,150 350,0 500,80 L500,150 L0,150 Z" />
                </svg>
              </div>
            </div>

            {/* Modal Body Info scroll container */}
            <div className="p-6 space-y-5 overflow-y-auto text-sm text-left">
              <div className="space-y-2 text-xs font-bold text-plum/60 uppercase tracking-wide">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-[var(--color-pink)] flex-shrink-0" />
                  <span>
                    {new Date(selectedEvent.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                      <>
                        {' - '}
                        {new Date(selectedEvent.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-[var(--color-pink)] flex-shrink-0" />
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-black text-[var(--color-plum)] mr-2">Pricing:</span>
                  <span className="text-[var(--color-pink)] font-black">{selectedEvent.price}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-black text-plum text-xs uppercase tracking-wider">About the Event</h4>
                <p className="text-sm font-light text-warm-black/85 leading-relaxed">
                  {selectedEvent.long_description || selectedEvent.short_description}
                </p>
              </div>

              {selectedEvent.highlights && selectedEvent.highlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-display font-black text-plum text-xs uppercase tracking-wider">Event Highlights</h4>
                  <ul className="space-y-1 list-disc pl-4 text-xs font-light text-warm-black/80">
                    {selectedEvent.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-5 bg-[var(--color-plum)]/5 border-t border-[var(--color-plum)]/10 flex flex-wrap justify-end gap-2">
              <a
                href={`/gatherings/${selectedEvent.slug}`}
                className="px-6 py-2.5 border border-[var(--color-plum)] hover:bg-[var(--color-plum)]/10 text-[var(--color-plum)] font-black rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
              >
                View Full Details →
              </a>
              <a
                href={getTargetLink(selectedEvent)}
                target={getTargetLink(selectedEvent).startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-[var(--color-plum)] hover:bg-[var(--color-pink)] text-[var(--color-linen)] font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow cursor-pointer text-center"
              >
                {getLinkText(selectedEvent)}
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
