import React from 'react';
import { getSiteSettings } from '@/lib/supabase';
import { MessageCircle, Users, Compass, Globe } from 'lucide-react';

export const revalidate = 0;

export default async function CommunityPage() {
  const settings = await getSiteSettings();

  return (
    <div className="bg-linen min-h-screen py-16 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-wider text-tangerine font-bold font-sans">
            Sanga Circle
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-plum mt-2 mb-6">
            The Connection Continues
          </h1>
          <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans">
            Sanga is built through people, not programmes. It doesn’t begin and end with major retreats—friendships and connections carry on day-to-day throughout the year.
          </p>
        </div>

        {/* WhatsApp Call to Action */}
        <div className="max-w-4xl mx-auto bg-plum text-linen rounded-3xl p-8 md:p-12 mb-16 shadow-lg border border-linen/10 relative overflow-hidden flex flex-col md:flex-row items-center md:justify-between gap-8">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-pink/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-sunshine/10 rounded-full blur-2xl" />
          
          <div className="flex-grow space-y-4 max-w-xl text-center md:text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-linen">
              Join the Sanga Circle
            </h2>
            <p className="text-sm sm:text-base text-linen/80 leading-relaxed font-light">
              For more information on TSI offerings, join the TSI Community WhatsApp. It&apos;s the central hub for local meetups, announcements, and direct conversations.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <a
              href={settings.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-4 bg-mint-green hover:bg-grass-green text-warm-black hover:text-linen font-bold text-sm tracking-wide uppercase rounded-full shadow-md transition-all duration-200"
            >
              <MessageCircle className="mr-2 h-5 w-5 fill-current" /> Join Sanga WhatsApp
            </a>
          </div>
        </div>

        {/* Community Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-linen p-8 rounded-3xl border border-plum/10 flex flex-col space-y-4">
            <div className="p-3 bg-pink/15 rounded-2xl w-fit text-plum">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-plum">Regional Sanga Circles</h3>
            <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light">
              Active regional circles organize offline gatherings across the Midwest, Northeast, West Coast, and parts of Canada. Meetups include hiking trips, potlucks, and backyard kirtans.
            </p>
          </div>

          <div className="bg-linen p-8 rounded-3xl border border-plum/10 flex flex-col space-y-4">
            <div className="p-3 bg-sunshine/15 rounded-2xl w-fit text-plum">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-plum">Online Conversations</h3>
            <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light">
              We host regular online talks and study spaces like the Heartspace program. It&apos;s a low-pressure online check-in to study texts, ask questions, and share inspirations.
            </p>
          </div>

          <div className="bg-linen p-8 rounded-3xl border border-plum/10 flex flex-col space-y-4">
            <div className="p-3 bg-sky-blue/15 rounded-2xl w-fit text-plum">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-plum">Bhakti Friendships</h3>
            <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light">
              Spiritual growth is easier together. Sanga connects you with peers at different stages of life, helping you navigate studies, careers, and relationships while keeping bhakti at the center.
            </p>
          </div>
        </div>

        {/* Future Platform Note */}
        <div className="max-w-3xl mx-auto text-center py-8 border-t border-plum/5">
          <p className="text-xs text-warm-black/55 leading-relaxed max-w-md mx-auto">
            We are currently refining a dedicated Sanga community platform to make hosting events and staying in touch even easier. Announcements will be posted in the WhatsApp groups.
          </p>
        </div>

      </div>
    </div>
  );
}
