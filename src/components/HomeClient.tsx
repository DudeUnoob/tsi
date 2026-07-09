'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Play, Heart, Users, MessageCircle, Calendar, X } from 'lucide-react';
import { SiteSettings, Event } from '@/lib/mockData';
import { useTheme } from '@/context/ThemeContext';

interface HomeClientProps {
  settings: SiteSettings;
  events: Event[];
}

const DEFAULT_HERO_IMAGES = [
  {
    src: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1752071425850-I8MCAXI0LAW4EPAVB1Y9/IMG_8842.jpg",
    label: "Summer Camp '26"
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/42af22d1-ea73-4806-ba7b-17c7c415afa5/DSCF0624.jpeg",
    label: "Gita Nagari Farm"
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg",
    label: "Friendship & Growth"
  }
];

export default function HomeClient({ settings, events }: HomeClientProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  // Build slideshow images: use admin-configured URLs if available, otherwise fall back to defaults
  const heroImages = (settings.hero_slideshow_images && settings.hero_slideshow_images.filter(Boolean).length > 0)
    ? settings.hero_slideshow_images.filter(Boolean).map((src, i) => ({
        src,
        label: DEFAULT_HERO_IMAGES[i]?.label ?? `Photo ${i + 1}`
      }))
    : DEFAULT_HERO_IMAGES;

  // Show slideshow only if not hidden by admin AND there is at least one image
  const showSlideshow = !settings.hero_slideshow_hidden && heroImages.length > 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroImages.length]);


  // Group events by category for the showcase cards
  const retreatsEvent = events.find(e => e.category === 'retreat' || e.slug === 'tsi-summit') || events[0];
  const talksEvent = events.find(e => e.category === 'online' || e.category === 'talk' || e.slug === 'heartspace') || events[1];
  const tripsEvent = events.find(e => e.category === 'trip' || e.slug === 'vrindavana-yatra') || events[2];

  // Animation presets
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 80, damping: 20 }
    }
  } as const;

  const { currentPaletteKey } = useTheme();
  const isDefaultTheme = false;
  const isBerryTheme = false;
  const isMintTheme = false;
  const isSunsetTheme = true;
  const isLightHeroTheme = false;

  return (
    <div className="relative w-full bg-linen text-warm-black font-sans">
      
      {/* 1. HERO SECTION WITH LAYERED WAVES */}
      <section 
        style={!isLightHeroTheme ? {
          background: isSunsetTheme 
            ? `linear-gradient(180deg, var(--color-plum) 0%, var(--color-pink) 65%, var(--color-sunshine) 100%)`
            : `linear-gradient(135deg, var(--color-plum) 0%, var(--color-pink) 50%, var(--color-sunshine) 100%)`
        } : undefined}
        className={`relative min-h-[90vh] md:min-h-[92vh] flex items-center justify-center overflow-hidden pt-4 pb-24 md:pt-14 md:pb-32 px-6 transition-all duration-500 bg-plum text-linen`}
      >
        {/* Flat organic blob shapes — graphic background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
          {/* Top-left large blob */}
          <svg className={`absolute -top-16 -left-20 w-[55vw] h-[75vh] transition-opacity duration-300 ${
            (isBerryTheme || isMintTheme) ? 'opacity-15' : isSunsetTheme ? 'opacity-30' : 'opacity-90'
          }`} viewBox="0 0 500 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <path d="M60,20 C180,-30 380,60 440,180 C500,300 460,460 340,520 C220,580 40,520 10,380 C-20,240 -60,70 60,20 Z" fill="var(--color-pink)" opacity="0.85"/>
          </svg>
          {/* Bottom-left accent blob */}
          <svg className={`absolute -bottom-20 -left-16 w-[40vw] h-[55vh] transition-opacity duration-300 ${
            (isBerryTheme || isMintTheme) ? 'opacity-15' : isSunsetTheme ? 'opacity-30' : 'opacity-75'
          }`} viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <path d="M80,60 C180,0 360,40 380,180 C400,320 280,460 140,460 C0,460 -40,320 20,180 C40,120 0,120 80,60 Z" fill="var(--color-plum)" opacity="0.9"/>
          </svg>
          {/* Right-side wavy blob */}
          <svg className={`absolute -right-24 top-1/2 -translate-y-1/2 w-[35vw] h-[90vh] transition-opacity duration-300 ${
            (isBerryTheme || isMintTheme) ? 'opacity-80' : isSunsetTheme ? 'opacity-30' : 'opacity-60'
          }`} viewBox="0 0 350 700" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <path d="M200,0 C320,40 400,200 350,380 C300,560 180,680 80,620 C-20,560 0,400 40,260 C80,120 80,−40 200,0 Z" fill="var(--color-pink)" opacity="0.7"/>
          </svg>
          {/* Small top-right accent */}
          <svg className="absolute top-0 right-0 w-[20vw] h-[35vh] opacity-50" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <path d="M160,0 C220,60 220,200 140,260 C60,320 -20,220 10,120 C40,20 100,-60 160,0 Z" fill="var(--color-sunshine)" opacity="0.6"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Heading and CTAs — expands to full width if slideshow is hidden */}
          <div className={`${showSlideshow ? 'md:col-span-7' : 'md:col-span-12'} space-y-8 flex flex-col items-start text-left`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full border ${
                (isBerryTheme || isMintTheme) ? 'bg-plum/10 border-plum/20' : 'bg-white/15 border-white/25'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                isSunsetTheme ? 'bg-white' : 'bg-pink'
              }`} />
              <span className={`text-xs uppercase tracking-widest font-black font-sans ${
                (isBerryTheme || isMintTheme) ? 'text-plum' : 'text-white'
              }`}>
                Welcome to Sanga
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className={`font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] ${
                (isBerryTheme || isMintTheme) ? 'text-plum' : isSunsetTheme ? 'text-white drop-shadow-sm' : 'text-sunshine'
              }`}
            >
              Sanga is a <br className="hidden sm:inline" />
              Vaishnava Youth <br className="hidden sm:inline" />
              Collective
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className={`text-lg sm:text-2xl leading-relaxed font-light font-sans max-w-xl ${
                (isBerryTheme || isMintTheme) ? 'text-plum/80' : isSunsetTheme ? 'text-white/95' : 'text-linen/90'
              }`}
            >
              For friendship, growth, and shared experience
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2"
            >
              <Link
                href={settings.primary_cta_url}
                className={`w-full sm:w-auto px-8 py-4 rounded-full font-black text-sm tracking-widest uppercase transition-all duration-200 text-center shadow-lg hover:shadow-xl active:scale-98 bg-white text-plum hover:bg-white/90`}
              >
                {settings.primary_cta_label}
              </Link>
              <a
                href={settings.secondary_cta_url}
                className={`w-full sm:w-auto px-8 py-4 bg-transparent border-2 rounded-full font-black text-sm tracking-widest uppercase transition-all duration-200 text-center active:scale-98 ${
                  (isBerryTheme || isMintTheme) ? 'border-plum/30 text-plum hover:bg-plum/10 hover:border-plum' : isSunsetTheme ? 'border-white/40 text-white hover:bg-white/10 hover:border-white' : 'border-linen/30 text-linen hover:bg-linen/10 hover:border-linen'
                }`}
              >
                {settings.secondary_cta_label}
              </a>
            </motion.div>
          </div>

          {/* Right Column: Stacked polaroid photo stack — hidden if admin disables */}
          {showSlideshow && (
          <div className="md:col-span-5 flex justify-center items-center relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="relative w-[480px] h-[310px] sm:w-[600px] sm:h-[385px]"
            >
              {/* Back card — decorative, slightly more rotated */}
              <div className="absolute inset-0 rounded-3xl bg-sunshine/60 border-4 border-sunshine/40 shadow-xl transform rotate-6 scale-95 translate-y-2" />

              {/* Middle card — previous image, less rotation */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden border-4 border-linen/30 shadow-xl transform -rotate-3 scale-97">
                <Image
                  src={heroImages[(slideIndex + heroImages.length - 1) % heroImages.length].src}
                  alt="Previous gathering"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-plum/20" />
              </div>

              {/* Top card — current image, straight on */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden border-4 border-linen/50 shadow-2xl">
                <AnimatePresence mode="sync">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={heroImages[slideIndex].src}
                      alt={heroImages[slideIndex].label}
                      fill
                      className="object-cover object-center"
                      priority={slideIndex === 0}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Caption strip at bottom of top card */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-plum/80 to-transparent px-4 pb-4 pt-10">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`caption-${slideIndex}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.35 }}
                      className="text-linen text-xs font-black uppercase tracking-widest"
                    >
                      {heroImages[slideIndex].label}
                    </motion.p>
                  </AnimatePresence>

                  {/* Dots inside the card at bottom */}
                  <div className="flex gap-1.5 mt-2">
                    {heroImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                          i === slideIndex ? 'bg-sunshine w-5' : 'bg-linen/40 w-1.5'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating badge — top right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 8 }}
              animate={{ opacity: 1, scale: 1, rotate: 12 }}
              transition={{ delay: 0.6, duration: 0.5, type: 'spring' }}
              className="absolute -top-6 -right-2 sm:-right-6 bg-pink text-warm-black text-xs font-black py-2 px-4 rounded-full shadow-lg select-none pointer-events-none"
            >
              Since 2014 🌿
            </motion.div>

            {/* Floating badge — bottom left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: -6 }}
              transition={{ delay: 0.75, duration: 0.5, type: 'spring' }}
              className="absolute -bottom-6 -left-2 sm:-left-6 bg-sunshine text-plum text-xs font-black py-2 px-4 rounded-full shadow-lg select-none pointer-events-none"
            >
              Friendship &amp; Growth
            </motion.div>
          </div>
          )}
        </div>

      {/* Wavy bottom divider separating Hero from Mission */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16 fill-linen">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,4.75,55.05,16.35,80,25.23,135.66,45.09,194.3,55.57,253,58.38A855,855,0,0,0,321.39,56.44Z" />
          </svg>
        </div>
      </section>

      {/* 2. MISSION STATEMENT SECTION */}
      <section className="relative bg-linen py-24 md:py-32 px-6 border-b border-plum/5">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="font-display text-2xl sm:text-4xl leading-relaxed text-plum font-medium tracking-tight">
            <span className="font-extrabold text-pink uppercase tracking-wider text-xs block mb-4">Our Core Mission</span>
            <strong>Sanga</strong> brings together young people exploring Krishna consciousness through friendship, conversation, and shared experience.
          </p>
          <div className="h-1 w-24 bg-sunshine mx-auto rounded-full" />
          <p className="font-sans text-lg sm:text-xl text-warm-black/80 leading-relaxed max-w-2xl mx-auto font-light">
            Through retreats, gatherings, and ongoing connection, members build relationships that carry into everyday life.
          </p>
        </div>
      </section>

      {/* 3. UPCOMING EXPERIENCES (ARCHED CARDS) */}
      <section className="bg-linen py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-pink font-black font-sans">
                Gatherings
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-black text-plum">
                Upcoming Experiences
              </h2>
            </div>
            <Link 
              href="/gatherings"
              className="inline-flex items-center text-sm font-black uppercase tracking-wider text-plum hover:text-pink transition-colors mt-4 md:mt-0 gap-1.5"
            >
              View All Gatherings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Cards Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Card 1: Retreats */}
            {retreatsEvent && (
              <motion.div 
                variants={itemVariants}
                className="flex flex-col bg-linen rounded-3xl overflow-hidden border border-plum/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Wavy Arched Label */}
                <div className="relative bg-plum text-linen py-4 text-center select-none overflow-hidden">
                  <span className="font-display text-xl font-bold uppercase tracking-widest relative z-10">
                    Retreats
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="relative block w-full h-4 fill-linen">
                      <path d="M0,80 C150,150 350,0 500,80 L500,150 L0,150 Z" />
                    </svg>
                  </div>
                </div>

                <div className="relative h-64 w-full overflow-hidden bg-plum/5">
                  <Image 
                    src={retreatsEvent.hero_image || "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/3da960ee-0e14-4ffa-9e31-2808e5e925ee/Summit26+Reg+Open+1x1.png"}
                    alt={retreatsEvent.title}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                </div>

                <div className="flex-grow p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-display text-2xl font-bold text-plum group-hover:text-pink transition-colors leading-tight">
                      {retreatsEvent.title}
                    </h3>
                    <p className="text-xs text-warm-black/60 font-sans font-bold uppercase tracking-wider flex items-center">
                      <Calendar className="mr-1.5 h-3.5 w-3.5 text-pink" />
                      {new Date(retreatsEvent.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {retreatsEvent.location}
                    </p>
                  </div>
                  <Link 
                    href={`/gatherings/${retreatsEvent.slug}`}
                    className="inline-flex items-center text-xs font-black uppercase tracking-widest text-plum group-hover:text-pink transition-colors"
                  >
                    View Retreat Details &rarr;
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Card 2: Talks */}
            {talksEvent && (
              <motion.div 
                variants={itemVariants}
                className="flex flex-col bg-linen rounded-3xl overflow-hidden border border-plum/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Wavy Arched Label */}
                <div className="relative bg-plum text-linen py-4 text-center select-none overflow-hidden">
                  <span className="font-display text-xl font-bold uppercase tracking-widest relative z-10">
                    Talks
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="relative block w-full h-4 fill-linen">
                      <path d="M0,80 C150,150 350,0 500,80 L500,150 L0,150 Z" />
                    </svg>
                  </div>
                </div>

                <div className="relative h-64 w-full overflow-hidden bg-plum/5">
                  <Image 
                    src={talksEvent.hero_image || "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1710889601569-YHJE3TDYRAEEVD2F4MNS/DSC01696.jpg"}
                    alt={talksEvent.title}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                </div>

                <div className="flex-grow p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-display text-2xl font-bold text-plum group-hover:text-pink transition-colors leading-tight">
                      {talksEvent.title}
                    </h3>
                    <p className="text-xs text-warm-black/60 font-sans font-bold uppercase tracking-wider flex items-center">
                      <Calendar className="mr-1.5 h-3.5 w-3.5 text-pink" />
                      {new Date(talksEvent.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {talksEvent.location}
                    </p>
                  </div>
                  <Link 
                    href={`/gatherings/${talksEvent.slug}`}
                    className="inline-flex items-center text-xs font-black uppercase tracking-widest text-plum group-hover:text-pink transition-colors"
                  >
                    View Session Details &rarr;
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Card 3: Trips */}
            {tripsEvent && (
              <motion.div 
                variants={itemVariants}
                className="flex flex-col bg-linen rounded-3xl overflow-hidden border border-plum/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Wavy Arched Label */}
                <div className="relative bg-plum text-linen py-4 text-center select-none overflow-hidden">
                  <span className="font-display text-xl font-bold uppercase tracking-widest relative z-10">
                    Trips
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="relative block w-full h-4 fill-linen">
                      <path d="M0,80 C150,150 350,0 500,80 L500,150 L0,150 Z" />
                    </svg>
                  </div>
                </div>

                <div className="relative h-64 w-full overflow-hidden bg-plum/5">
                  <Image 
                    src={tripsEvent.hero_image || "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1515990475221-G6PMK88KDKEZBVPTKG5Q/20449208_1382154528538531_900680314886261379_o.jpg"}
                    alt={tripsEvent.title}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                </div>

                <div className="flex-grow p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-display text-2xl font-bold text-plum group-hover:text-pink transition-colors leading-tight">
                      {tripsEvent.title}
                    </h3>
                    <p className="text-xs text-warm-black/60 font-sans font-bold uppercase tracking-wider flex items-center">
                      <Calendar className="mr-1.5 h-3.5 w-3.5 text-pink" />
                      {new Date(tripsEvent.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {tripsEvent.location}
                    </p>
                  </div>
                  <Link 
                    href={`/gatherings/${tripsEvent.slug}`}
                    className="inline-flex items-center text-xs font-black uppercase tracking-widest text-plum group-hover:text-pink transition-colors"
                  >
                    View Trip Details &rarr;
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 4. THE CONNECTION CONTINUES (OVERLAPPING CIRCLES GRID) */}
      <section className="bg-linen py-24 px-6 relative border-t border-plum/5 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Left Side: Copy and Button */}
          <div className="md:col-span-6 space-y-8 text-left">
            <span className="text-xs uppercase tracking-wider text-pink font-black font-sans bg-plum/5 py-1.5 px-4 rounded-full border border-plum/10">
              The Connection Continues
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-plum leading-tight">
              More than just retreats
            </h2>
            <p className="text-base sm:text-lg text-warm-black/80 leading-relaxed font-sans font-light">
              Sanga doesn&apos;t begin and end with major events. Smaller gatherings, conversations, online sessions, and ongoing friendships continue throughout the year and across different stages of life.
            </p>
            <div>
              <Link 
                href="/gatherings"
                className="inline-flex px-8 py-4 bg-plum hover:opacity-90 text-linen rounded-full font-black text-sm tracking-widest uppercase transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                See What&apos;s Happening
              </Link>
            </div>
          </div>

          {/* Right Side: Overlapping Concentric Circles Displays */}
          <div className="md:col-span-6 relative h-[380px] sm:h-[450px] w-full flex items-center justify-center">
            {/* Center Main Circle */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-8 border-sunshine overflow-hidden shadow-xl z-20 hover:scale-102 transition-transform duration-300">
              <Image 
                src="https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1583105062504-DL0ISKN110VIOHCM4RPP/image-asset.jpeg"
                alt="Sanga Friendship"
                fill
                className="object-cover"
              />
            </div>

            {/* Bottom Left Circle */}
            <div className="absolute bottom-4 left-4 sm:left-12 w-36 h-36 sm:w-44 sm:h-44 rounded-full border-6 border-pink overflow-hidden shadow-lg z-30 hover:scale-103 transition-transform duration-300 bg-[#1e1d1b]">
              <Image 
                src="https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1583105188234-XCZMXLUCMMPFYV4F7GBN/image-asset.jpeg"
                alt="Sanga Laughs"
                fill
                className="object-cover"
              />
            </div>

            {/* Top Right Circle */}
            <div className="absolute top-4 right-4 sm:right-12 w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-sunshine overflow-hidden shadow-lg z-10 hover:scale-103 transition-transform duration-300 bg-[#1e1d1b]">
              <Image 
                src="https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/cb2418ed-47e3-4cc4-80db-e0f26530aaa1/MW26+Reg+Open+Post+45.png"
                alt="Sanga Association"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. MOMENTS VIDEO SECTION */}
      <section className="bg-plum text-linen py-24 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1E1D1B]/20 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
          <span className="text-xs uppercase tracking-wider text-pink font-black font-sans bg-linen/10 py-1 px-3.5 rounded-full border border-linen/20">
            Retreat Memories
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-linen">
            The moments in between
          </h2>
          <p className="text-sm sm:text-base text-linen/70 leading-relaxed max-w-2xl mx-auto font-light">
            Take a look at snapshots of conversations, musical kirtans, workshops, and shared memories from our recent summer retreats.
          </p>
          
          {/* Video Trigger Container */}
          <div 
            onClick={() => setIsVideoOpen(true)}
            className="relative aspect-video w-full max-w-3xl mx-auto bg-warm-black rounded-3xl overflow-hidden shadow-2xl border border-linen/10 group cursor-pointer"
          >
            <Image 
              src={settings.promo_video_cover_url || "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1772131613598-JI7G8HEMBQWNK1Y32ADD/DSC_0022.jpg"} 
              alt="Sanga Video Cover" 
              fill
              className="object-cover opacity-60 group-hover:scale-101 transition-transform duration-700"
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

      {/* 6. SUPPORT SECTION */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
        <span className="text-xs uppercase tracking-wider text-pink font-black font-sans">
          Support Sanga
        </span>
        <h2 className="font-display text-4xl sm:text-5xl font-black text-plum">
          {settings.support_headline}
        </h2>
        <p className="text-base sm:text-lg text-warm-black/80 leading-relaxed font-sans max-w-2xl mx-auto font-light">
          {settings.support_text}
        </p>
        <Link 
          href="/support"
          className="inline-flex items-center px-8 py-4 bg-plum text-linen hover:opacity-90 rounded-full font-black text-sm tracking-widest uppercase transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
        >
          Become a Supporter <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>

      {/* Video Modal Overlay */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1E1D1B]/90 backdrop-blur-md transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setIsVideoOpen(false)} />
          <div className="relative w-full max-w-4xl bg-[#1E1D1B] rounded-3xl overflow-hidden shadow-2xl border border-linen/10 aspect-video z-10 scale-95 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-[#1E1D1B]/50 hover:bg-[#1E1D1B]/80 text-linen hover:text-pink rounded-full transition-all cursor-pointer"
              aria-label="Close video"
            >
              <X className="h-6 w-6" />
            </button>
            <iframe
              src={(() => {
                const url = settings.promo_video_url || "https://www.youtube.com/embed/bEBlO9HGTvQ";
                if (url.includes('/embed/')) {
                  return url.includes('autoplay=1') ? url : (url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`);
                }
                let videoId = "";
                if (url.includes('youtu.be/')) {
                  videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
                } else if (url.includes('v=')) {
                  videoId = url.split('v=')[1]?.split('&')[0];
                }
                return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : `${url}?autoplay=1`;
              })()}
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
