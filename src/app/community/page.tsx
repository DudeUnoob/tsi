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

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20 space-y-8">
        
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento Item 1: WhatsApp Quote Banner (Spans 12 columns) */}
          <div className="col-span-12 glass rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-plum/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute right-0 top-0 w-64 h-64 bg-pink/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <p className="font-display text-3xl sm:text-4xl font-black text-plum leading-tight">
                &ldquo;Come for the experience. Stay for the people.&rdquo;
              </p>
              <p className="text-pink font-sans text-xs tracking-wider uppercase font-black">
                The Vaishnava Youth Collective
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <a
                href={settings.whatsapp_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 bg-plum hover:bg-plum/90 text-linen font-black text-sm tracking-widest uppercase rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-97 cursor-pointer"
              >
                <MessageCircle className="mr-2 h-5 w-5 fill-current" /> Join Sanga WhatsApp
              </a>
            </div>
          </div>

          {/* Bento Item 2: Regional Circles (Spans 8 columns) */}
          <div className="col-span-12 md:col-span-8 glass p-8 sm:p-10 rounded-[2.5rem] flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink/5 rounded-full pointer-events-none transition-all duration-300 group-hover:scale-150" />
            <div className="space-y-6">
              <div className="p-4 bg-pink/15 rounded-2xl w-fit text-plum">
                <Compass className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-3xl font-black text-plum group-hover:text-pink transition-colors">
                  Regional Circles
                </h3>
                <p className="text-sm sm:text-base text-warm-black/85 leading-relaxed font-sans font-light">
                  Active regional circles organize offline gatherings across the Midwest, Northeast, West Coast, and parts of Canada. Meetups include hiking trips, potlucks, and backyard kirtans.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-xs font-black uppercase tracking-wider text-plum/60 gap-1.5 mt-8 border-t border-plum/10">
              <MapPin className="w-4 h-4 text-pink" /> 4 Active Regions
            </div>
          </div>

          {/* Bento Item 3: Quick Stats (Spans 4 columns) */}
          <div className="col-span-12 md:col-span-4 glass bg-pink/5 p-8 rounded-[2.5rem] flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden border border-pink/20">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-pink/10 rounded-full pointer-events-none" />
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-pink bg-pink/10 px-3 py-1 rounded-full border border-pink/20">
                Outreach Stats
              </span>
              <h4 className="font-display text-4xl font-black text-plum tracking-tight">1000+</h4>
              <p className="text-xs text-warm-black/75 font-sans font-light leading-relaxed">
                Vaishnava youth connected through chat spaces, retreats, and regional study sessions globally.
              </p>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-plum/65 pt-6 border-t border-plum/10 mt-6">
              Relationship-focused
            </div>
          </div>

          {/* Bento Item 4: Study Check-ins (Spans 4 columns) */}
          <div className="col-span-12 md:col-span-4 glass p-8 rounded-[2.5rem] flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink/5 rounded-full pointer-events-none" />
            <div className="space-y-6">
              <div className="p-4 bg-pink/25 rounded-2xl w-fit text-plum">
                <Globe className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-2xl font-black text-plum group-hover:text-pink transition-colors leading-tight">
                  Online Conversations
                </h3>
                <p className="text-xs sm:text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                  We host regular online talks and study spaces like the Heartspace program. It&apos;s a low-pressure online check-in to study texts, ask questions, and share inspirations.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-xs font-black uppercase tracking-wider text-plum/60 gap-1.5 mt-8 border-t border-plum/10">
              <Sparkles className="w-4 h-4 text-pink" /> Study check-ins
            </div>
          </div>

          {/* Bento Item 5: Bhakti Friendships (Spans 8 columns) */}
          <div className="col-span-12 md:col-span-8 glass p-8 sm:p-10 rounded-[2.5rem] flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-pink/5 rounded-full pointer-events-none transition-all duration-300 group-hover:scale-150" />
            <div className="space-y-6">
              <div className="p-4 bg-pink/15 rounded-2xl w-fit text-plum">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-3xl font-black text-plum group-hover:text-pink transition-colors">
                  Bhakti Friendships
                </h3>
                <p className="text-sm sm:text-base text-warm-black/85 leading-relaxed font-sans font-light">
                  Spiritual growth is easier together. Sanga connects you with peers at different stages of life, helping you navigate studies, careers, and relationships while keeping bhakti at the center.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center text-xs font-black uppercase tracking-wider text-plum/60 gap-1.5 mt-8 border-t border-plum/10">
              <Heart className="w-4 h-4 text-pink fill-current" /> Relationship-driven
            </div>
          </div>
          
        </div>

        {/* Future Platform Note */}
        <div className="max-w-3xl mx-auto text-center py-10 border-t border-plum/10 bg-plum/5 rounded-[2rem] px-6">
          <p className="text-xs text-warm-black/60 leading-relaxed max-w-md mx-auto">
            We are currently refining a dedicated Sanga community platform to make hosting events and staying in touch even easier. Announcements will be posted in the WhatsApp groups.
          </p>
        </div>
      </div>

    </div>
  );
}
