'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Play, Heart, Users, MessageCircle, Calendar } from 'lucide-react';
import { SiteSettings, Event } from '@/lib/mockData';

interface HomeClientProps {
  settings: SiteSettings;
  events: Event[];
}

export default function HomeClient({ settings, events }: HomeClientProps) {
  // Animation presets
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 }
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 py-20 bg-gradient-to-b from-linen via-linen to-linen/60">
        {/* Soft floating background circles */}
        <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-sunshine/10 blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-pink/10 blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center space-x-2 px-4 py-1.5 bg-plum/5 rounded-full border border-plum/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-pink animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-plum font-bold font-sans">
              Welcome to the Sanga Collective
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-plum leading-[1.08] mb-6"
          >
            {settings.hero_headline}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg sm:text-xl text-warm-black/75 leading-relaxed max-w-2xl mb-10 font-sans"
          >
            {settings.hero_subheadline}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Link 
              href={settings.primary_cta_url}
              className="w-full sm:w-auto px-8 py-4 bg-plum text-linen hover:bg-tangerine rounded-full font-bold text-sm tracking-wide uppercase transition-all duration-200 text-center hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              {settings.primary_cta_label}
            </Link>
            <a 
              href={settings.secondary_cta_url}
              className="w-full sm:w-auto px-8 py-4 bg-linen border border-plum/20 text-plum hover:bg-plum/5 rounded-full font-bold text-sm tracking-wide uppercase transition-all duration-200 text-center"
            >
              {settings.secondary_cta_label}
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Intro Section */}
      <section id="experiences" className="max-w-7xl mx-auto px-6 py-24 border-t border-plum/5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="col-span-1 md:col-span-5">
            <span className="text-xs uppercase tracking-wider text-tangerine font-bold font-sans">
              Who We Are
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-plum mt-2 mb-6 leading-tight">
              {settings.intro_headline}
            </h2>
            <div className="h-1 w-20 bg-sunshine rounded-full" />
          </div>
          <div className="col-span-1 md:col-span-7">
            <p className="text-base sm:text-lg text-warm-black/80 leading-relaxed font-sans font-light">
              {settings.intro_text}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Upcoming Experiences Grid */}
      <section className="bg-linen/40 py-24 border-t border-b border-plum/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-wider text-pink font-bold font-sans">
                Gatherings
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-plum mt-2">
                Upcoming Experiences
              </h2>
            </div>
            <Link 
              href="/gatherings"
              className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-plum hover:text-tangerine mt-4 sm:mt-0 transition-colors"
            >
              View All Gatherings <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {events.slice(0, 3).map((event) => (
              <motion.div 
                key={event.id}
                variants={itemVariants}
                className="group flex flex-col bg-linen rounded-3xl border border-plum/10 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image Wrap */}
                <div className="relative h-64 w-full bg-plum/5 overflow-hidden">
                  {event.hero_image ? (
                    <Image 
                      src={event.hero_image} 
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-plum/5">
                      <Calendar className="h-10 w-10 text-plum/20" />
                    </div>
                  )}
                  {/* Category Tag */}
                  <span className="absolute top-4 left-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-linen text-plum rounded-full border border-plum/10 shadow-sm">
                    {event.category}
                  </span>
                  {/* Age Tag */}
                  {event.age_range && (
                    <span className="absolute top-4 right-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-pink text-warm-black rounded-full shadow-sm">
                      Ages {event.age_range}
                    </span>
                  )}
                </div>

                {/* Content Wrap */}
                <div className="flex-grow p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-plum group-hover:text-tangerine transition-colors mb-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-warm-black/60 font-sans font-medium mb-4">
                      {event.location} &bull; {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-warm-black/75 leading-relaxed font-sans line-clamp-3 mb-6">
                      {event.short_description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-plum/5">
                    <span className="text-sm font-bold text-plum font-sans">
                      {event.price}
                    </span>
                    <Link 
                      href={`/gatherings/${event.slug}`}
                      className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-plum group-hover:text-tangerine transition-colors"
                    >
                      Details <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Connection / WhatsApp Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center">
          <span className="text-xs uppercase tracking-wider text-sky-blue font-bold font-sans">
            Stay Connected
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-plum mt-2 mb-6">
            {settings.community_headline}
          </h2>
          <p className="text-base sm:text-lg text-warm-black/85 leading-relaxed font-sans mb-8">
            {settings.community_text}
          </p>
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-warm-black/60 font-semibold italic">
              “For more information on TSI offerings, join the TSI Community WhatsApp.”
            </p>
            <div>
              <a
                href={settings.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3.5 bg-mint-green hover:bg-grass-green text-warm-black hover:text-linen font-bold text-sm tracking-wide uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-200"
              >
                <MessageCircle className="mr-2 h-5 w-5 fill-current" /> Join the Community WhatsApp
              </a>
            </div>
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-5 bg-sunshine/5 rounded-3xl p-8 border border-plum/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sunshine/10 rounded-bl-full -z-10" />
          <h3 className="font-display text-xl font-bold text-plum mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5 text-tangerine" /> Smaller Gatherings
          </h3>
          <p className="text-sm text-warm-black/75 leading-relaxed font-sans mb-6">
            We meet online and offline across regions (Midwest, East Coast, South, and Canada) for weekly readings, discussions, bhajans, and check-ins.
          </p>
          <h3 className="font-display text-xl font-bold text-plum mb-4 flex items-center">
            <Heart className="mr-2 h-5 w-5 text-pink" /> Devotee Friendship
          </h3>
          <p className="text-sm text-warm-black/75 leading-relaxed font-sans">
            Navigating spiritual life has its challenges. Sanga helps you find like-minded friends who support you through transitions, study, and daily bhakti practice.
          </p>
        </div>
      </section>

      {/* 5. Moments Video / Media Section */}
      <section className="bg-plum text-linen py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs uppercase tracking-wider text-pink font-bold font-sans">
            Retreat Memories
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-linen mt-2 mb-6">
            The Moments in Between
          </h2>
          <p className="text-sm sm:text-base text-linen/75 leading-relaxed max-w-2xl mx-auto mb-10">
            Take a look at snapshots of conversations, musical kirtans, workshops, and shared memories from our recent summer retreats.
          </p>
          
          {/* Mock Video Container */}
          <div className="relative aspect-video w-full max-w-3xl mx-auto bg-warm-black rounded-3xl overflow-hidden shadow-2xl border border-linen/10 group">
            <Image 
              src="https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1772131613598-JI7G8HEMBQWNK1Y32ADD/DSC_0022.jpg" 
              alt="Sanga Video Cover" 
              fill
              className="object-cover opacity-60 group-hover:scale-102 transition-transform duration-500"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                className="p-5 sm:p-6 bg-pink text-warm-black rounded-full shadow-lg hover:scale-110 active:scale-95 hover:bg-sunshine transition-all duration-300 cursor-pointer"
                aria-label="Play video"
              >
                <Play className="h-6 sm:h-8 w-6 sm:w-8 fill-current translate-x-0.5" />
              </button>
            </div>
            {/* Small label */}
            <div className="absolute bottom-4 left-6 text-xs text-linen/60 font-sans tracking-wide">
              Sanga Summer Retrospect Video &bull; 3:45
            </div>
          </div>
        </div>
      </section>

      {/* 6. Support Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <span className="text-xs uppercase tracking-wider text-tangerine font-bold font-sans">
          Support Sanga
        </span>
        <h2 className="font-display text-3xl sm:text-5xl font-bold text-plum mt-2 mb-6">
          {settings.support_headline}
        </h2>
        <p className="text-base sm:text-lg text-warm-black/80 leading-relaxed mb-10 font-sans max-w-2xl mx-auto">
          {settings.support_text}
        </p>
        <Link 
          href="/support"
          className="inline-flex items-center px-8 py-4 bg-plum text-linen hover:bg-tangerine rounded-full font-bold text-sm tracking-wide uppercase transition-all duration-200"
        >
          Become a Supporter <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>

    </div>
  );
}
