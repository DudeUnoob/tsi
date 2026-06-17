'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Play, Heart, Users, MessageCircle, Calendar, X } from 'lucide-react';
import { SiteSettings, Event } from '@/lib/mockData';

interface HomeClientProps {
  settings: SiteSettings;
  events: Event[];
}

export default function HomeClient({ settings, events }: HomeClientProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const row1Images = [
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1752071425850-I8MCAXI0LAW4EPAVB1Y9/IMG_8842.jpg",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1515990475221-G6PMK88KDKEZBVPTKG5Q/20449208_1382154528538531_900680314886261379_o.jpg",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/42af22d1-ea73-4806-ba7b-17c7c415afa5/DSCF0624.jpeg",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1772131613598-JI7G8HEMBQWNK1Y32ADD/DSC_0022.jpg",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1583105062504-DL0ISKN110VIOHCM4RPP/image-asset.jpeg"
  ];

  const row2Images = [
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/aca2ad4f-66ca-4068-8f63-ab6a20bdbb67/1000133787.png",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/3da960ee-0e14-4ffa-9e31-2808e5e925ee/Summit26+Reg+Open+1x1.png",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/cb2418ed-47e3-4cc4-80db-e0f26530aaa1/MW26+Reg+Open+Post+45.png",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/f1d1c411-95f8-4755-80a8-2afc7ffd537b/4.png",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1583105188234-XCZMXLUCMMPFYV4F7GBN/image-asset.jpeg",
    "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/24f4d1b2-d8b6-451a-9eb5-5d0fceca8616/3.png"
  ];

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
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-linen via-linen to-linen/60 overflow-hidden">
        {/* Soft floating background circles */}
        <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-sunshine/10 blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-pink/10 blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center mb-12">
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

        {/* Full-width Horizontal Marquee in Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="w-full max-w-7xl mx-auto overflow-hidden relative"
        >
          {/* Left & Right fading overlays */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-linen to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-linen to-transparent z-10 pointer-events-none" />

          <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused] cursor-grab active:cursor-grabbing">
            {[...row1Images, ...row2Images, ...row1Images, ...row2Images].map((src, index) => (
              <div 
                key={`hero-marquee-${index}`}
                className="relative w-48 sm:w-64 h-32 sm:h-40 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:scale-102 active:scale-99 transition-all duration-300 border border-plum/5"
              >
                <Image 
                  src={src} 
                  alt={`Sanga Moment ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 192px, 256px"
                  className="object-cover pointer-events-none"
                  priority={index < 5}
                />
              </div>
            ))}
          </div>
        </motion.div>
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
          
          {/* Interactive Video Container */}
          <div 
            onClick={() => setIsVideoOpen(true)}
            className="relative aspect-video w-full max-w-3xl mx-auto bg-warm-black rounded-3xl overflow-hidden shadow-2xl border border-linen/10 group cursor-pointer"
          >
            <Image 
              src="https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1772131613598-JI7G8HEMBQWNK1Y32ADD/DSC_0022.jpg" 
              alt="Sanga Video Cover" 
              fill
              className="object-cover opacity-60 group-hover:scale-102 transition-transform duration-500"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="p-5 sm:p-6 bg-pink text-warm-black rounded-full shadow-lg group-hover:scale-110 group-active:scale-95 group-hover:bg-sunshine transition-all duration-300"
                aria-label="Play video"
              >
                <Play className="h-6 sm:h-8 w-6 sm:w-8 fill-current translate-x-0.5" />
              </div>
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
      {/* Video Modal Overlay */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-warm-black/85 backdrop-blur-md transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setIsVideoOpen(false)} />
          <div className="relative w-full max-w-4xl bg-warm-black rounded-3xl overflow-hidden shadow-2xl border border-linen/10 aspect-video z-10 scale-95 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-warm-black/50 hover:bg-warm-black/80 text-linen hover:text-pink rounded-full transition-all cursor-pointer"
              aria-label="Close video"
            >
              <X className="h-6 w-6" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/bEBlO9HGTvQ?autoplay=1"
              title="Sanga Retreat Highlights"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

    </div>
  );
}
