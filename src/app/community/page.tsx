import React from 'react';
import { getSiteSettings } from '@/lib/supabase';
import { MessageCircle, MapPin, Sparkles, Heart, Compass, Users, Globe } from 'lucide-react';

export const revalidate = 0;

export default async function CommunityPage() {
  const settings = await getSiteSettings();

  return (
    <div className="bg-linen min-h-screen font-sans pb-24 text-warm-black">
      {/* Hero Header Section with Arch Pattern */}
      <div className="relative bg-plum text-linen pt-16 pb-32 overflow-hidden">
        {/* Layered Decorative Blob/Circles in Background */}
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-sunshine/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-1/4 w-96 h-96 bg-pink/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sunshine/20 border border-sunshine/40 text-sunshine text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Sanga Circle
          </span>
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
            The connection <span className="text-sunshine">continues</span>
          </h1>
          <p className="text-lg sm:text-xl text-linen/85 max-w-2xl mx-auto font-light leading-relaxed">
            Sanga is built through people, not programmes. It doesn’t begin and end with major retreats—friendships and connections carry on day-to-day throughout the year.
          </p>
        </div>

        {/* Decorative Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-12 text-linen fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,100 600,20 900,80 L1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        {/* Quote Card (Brand Identity System Statement) */}
        <div className="bg-pink text-plum rounded-3xl p-8 md:p-12 mb-16 shadow-xl border border-plum/10 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute right-0 top-0 w-64 h-64 bg-pink/10 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 max-w-xl">
            <p className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              &ldquo;Come for the experience. Stay for the people.&rdquo;
            </p>
            <p className="text-plum/80 text-sm font-sans tracking-wide uppercase font-semibold">
              The foundational heart of the Vaishnava Youth Collective
            </p>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto">
            <a
              href={settings.whatsapp_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 bg-plum hover:bg-plum/90 text-linen hover:text-pink font-bold text-sm tracking-wide uppercase rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageCircle className="mr-2 h-5 w-5 fill-current" /> Join Sanga WhatsApp
            </a>
          </div>
        </div>

        {/* Section Heading */}
        <div className="text-center mb-12 space-y-2">
          <h2 className="font-display text-3xl sm:text-4xl text-plum">How We Stay Connected</h2>
          <div className="w-12 h-1 bg-pink mx-auto rounded-full" />
        </div>

        {/* Community Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Card 1 */}
          <div className="bg-linen p-8 rounded-[2rem] border border-plum/10 flex flex-col justify-between hover:border-plum/30 transition-all duration-300 hover:shadow-lg group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink/5 rounded-full pointer-events-none transition-all duration-300 group-hover:scale-150" />
            <div className="space-y-6">
              <div className="p-4 bg-pink/15 rounded-2xl w-fit text-plum">
                <Compass className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-2xl font-bold text-plum group-hover:text-pink transition-colors">
                  Regional Circles
                </h3>
                <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                  Active regional circles organize offline gatherings across the Midwest, Northeast, West Coast, and parts of Canada. Meetups include hiking trips, potlucks, and backyard kirtans.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-xs font-bold uppercase tracking-wider text-plum/60 gap-1.5 mt-8 border-t border-plum/5">
              <MapPin className="w-4 h-4 text-pink" /> 4 Regions & Growing
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-linen p-8 rounded-[2rem] border border-plum/10 flex flex-col justify-between hover:border-plum/30 transition-all duration-300 hover:shadow-lg group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink/10 rounded-full pointer-events-none transition-all duration-300 group-hover:scale-150" />
            <div className="space-y-6">
              <div className="p-4 bg-pink/25 rounded-2xl w-fit text-plum">
                <Globe className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-2xl font-bold text-plum group-hover:text-pink transition-colors">
                  Online Conversations
                </h3>
                <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                  We host regular online talks and study spaces like the Heartspace program. It&apos;s a low-pressure online check-in to study texts, ask questions, and share inspirations.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-xs font-bold uppercase tracking-wider text-plum/60 gap-1.5 mt-8 border-t border-plum/5">
              <Sparkles className="w-4 h-4 text-pink" /> Online Programs
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-linen p-8 rounded-[2rem] border border-plum/10 flex flex-col justify-between hover:border-plum/30 transition-all duration-300 hover:shadow-lg group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink/5 rounded-full pointer-events-none transition-all duration-300 group-hover:scale-150" />
            <div className="space-y-6">
              <div className="p-4 bg-pink/15 rounded-2xl w-fit text-plum">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-2xl font-bold text-plum group-hover:text-pink transition-colors">
                  Bhakti Friendships
                </h3>
                <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                  Spiritual growth is easier together. Sanga connects you with peers at different stages of life, helping you navigate studies, careers, and relationships while keeping bhakti at the center.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-xs font-bold uppercase tracking-wider text-plum/60 gap-1.5 mt-8 border-t border-plum/5">
              <Heart className="w-4 h-4 text-pink fill-current" /> Relationship-driven
            </div>
          </div>
        </div>

        {/* Future Platform Note */}
        <div className="max-w-3xl mx-auto text-center py-10 border-t border-plum/10 bg-plum/5 rounded-3xl px-6">
          <p className="text-xs text-warm-black/60 leading-relaxed max-w-md mx-auto">
            We are currently refining a dedicated Sanga community platform to make hosting events and staying in touch even easier. Announcements will be posted in the WhatsApp groups.
          </p>
        </div>
      </div>
    </div>
  );
}
