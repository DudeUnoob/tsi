import React from 'react';
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/firebase';
import { Heart, ShieldCheck, DollarSign, Calendar, ArrowUpRight } from 'lucide-react';

export const revalidate = 0;
export const metadata: Metadata = {
  title: 'Support Sanga',
  description: 'Help Sanga create welcoming spaces for friendship, growth, and shared spiritual experience.',
  alternates: { canonical: 'https://www.sangainitiative.org/support' },
};

export default async function SupportPage() {
  const settings = await getSiteSettings();

  return (
    <div className="bg-linen min-h-screen py-16 font-sans text-warm-black">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest text-pink font-black font-sans bg-plum/5 py-1.5 px-4 rounded-full border border-plum/10">
            Giving Back
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-plum">
            Support Sanga&apos;s Future
          </h1>
          <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans font-light">
            The Sanga Initiative is youth-led and community-supported. Your generosity keeps retreats accessible, expands programs, and seeds new spaces for devotee association.
          </p>
        </div>

        {/* Action Donation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Card 1: One-time donation */}
          <div className="bg-[var(--color-linen)] p-8 rounded-3xl border border-[var(--color-plum)]/15 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="space-y-4">
              <div className="p-3.5 bg-[var(--color-pink)]/15 rounded-2xl w-fit text-[var(--color-plum)] border border-[var(--color-pink)]/10 shadow-sm">
                <DollarSign className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[var(--color-plum)]">One-Time Gift</h2>
              <p className="text-sm text-[var(--color-warm-black)]/80 leading-relaxed font-sans font-light">
                Support a specific retreat, sponsor a speaker, or help fund supplies. A one-time donation provides immediate resources for our active events.
              </p>
            </div>
            
            <div className="pt-8">
              <a
                href={settings.one_time_donation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-6 py-4 bg-[var(--color-plum)] text-[var(--color-linen)] hover:bg-[var(--color-pink)] hover:text-[var(--color-linen)] font-black text-xs uppercase tracking-widest rounded-full shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer"
              >
                Donate Once <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Monthly Devotee */}
          <div className="bg-[var(--color-linen)] p-8 rounded-3xl border border-[var(--color-plum)]/15 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="space-y-4">
              <div className="p-3.5 bg-[var(--color-sunshine)]/15 rounded-2xl w-fit text-[var(--color-plum)] border border-[var(--color-sunshine)]/10 shadow-sm">
                <Calendar className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[var(--color-plum)]">Monthly Supporter</h2>
              <p className="text-sm text-[var(--color-warm-black)]/80 leading-relaxed font-sans font-light">
                Become a pillar of Sanga&apos;s future. Ongoing monthly support helps us budget, lease retreat sites in advance, and plan scholarships for those in need.
              </p>
            </div>
            
            <div className="pt-8">
              <a
                href={settings.monthly_donation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-6 py-4 bg-[var(--color-linen)] border-2 border-[var(--color-plum)] text-[var(--color-plum)] hover:bg-[var(--color-plum)]/5 font-black text-xs uppercase tracking-widest rounded-full transition-all duration-200 inline-flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer"
              >
                Become a Monthly Donor <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Detailed Explanation / Matching Section */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 py-12 border-t border-[var(--color-plum)]/10">
          <div className="space-y-4 font-sans">
            <h3 className="font-display text-xl font-bold text-[var(--color-plum)] flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5 text-[#66CC6E]" /> 501(c)(3) Tax-Exempt Status
            </h3>
            <p className="text-sm text-[var(--color-warm-black)]/75 leading-relaxed font-light">
              The Sanga Initiative is a registered 501(c)(3) non-profit organization in the United States. All donations are tax-deductible to the fullest extent of the law. You will receive an automated email receipt for tax filing.
            </p>
            <p className="text-xs text-[var(--color-warm-black)]/60 leading-relaxed font-light italic">
              For queries or custom donation checks, contact us at <a href="mailto:finance@sangainitiative.org" className="underline font-bold text-[var(--color-plum)] hover:text-[var(--color-pink)]">finance@sangainitiative.org</a>.
            </p>
          </div>

          <div className="space-y-4 font-sans">
            <h3 className="font-display text-xl font-bold text-[var(--color-plum)] flex items-center">
              <Heart className="mr-2 h-5 w-5 text-[var(--color-pink)]" /> Employer Gift Matching
            </h3>
            <p className="text-sm text-[var(--color-warm-black)]/75 leading-relaxed font-light">
              Many corporate companies match charitable donations made by their employees dollar-for-dollar. Ask your human resources department if your company matches donations to 501(c)(3) youth and educational organizations.
            </p>
            <p className="text-sm text-[var(--color-warm-black)]/75 leading-relaxed font-light">
              By utilizing matching, you can double your support for Sanga camps and retreats without paying anything extra!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
