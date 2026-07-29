import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCachedEventBySlug as getEventBySlug, getCachedEvents } from '@/lib/cached-data';
import { Calendar, MapPin, Users, AlertCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { formatEventDate } from '@/lib/event-dates';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300; // Cached; admin saves bust the tag via /api/revalidate

/**
 * Prerenders the known event pages at build time so they are served from the
 * static cache. `dynamicParams` stays at its default of `true`, so an event
 * published after the build still renders on demand.
 */
export async function generateStaticParams() {
  const events = await getCachedEvents();
  return events
    .filter(event => Boolean(event.slug))
    .map(event => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: 'Event Not Found' };

  return {
    title: event.seo_title || event.title,
    description: event.seo_description || event.short_description,
    alternates: {
      canonical: `https://www.sangainitiative.org/events/${event.slug}`,
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const isClosed = event.status === 'closed' || event.status === 'past';
  const isSoldOut = event.status === 'sold-out';
  const isOpen = event.status === 'open';
  const isComingSoon = event.status === 'coming-soon';

  return (
    <article className="min-h-screen bg-linen text-warm-black pb-24 font-sans">
      
      {/* 1. Header Banner & Hero Image */}
      <div className="relative w-full h-[50vh] md:h-[60vh] bg-plum overflow-hidden flex items-end">
        {event.hero_image ? (
          <Image 
            src={event.hero_image} 
            alt={event.title}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-plum via-pink to-warm-black opacity-90" />
        )}

        {/* Floating gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-plum via-transparent to-black/30 pointer-events-none" />
        
        {/* Top Breadcrumb Overlay */}
        <div className="absolute top-6 left-6 md:left-12 z-10">
          <Link 
            href="/events"
            className="inline-flex items-center px-5 py-2.5 bg-linen hover:bg-sunshine text-plum text-xs font-black uppercase tracking-widest rounded-full shadow-md transition-all active:scale-97 cursor-pointer"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Events
          </Link>
        </div>

        {/* Text Details Overlay */}
        <div className="max-w-7xl w-full mx-auto px-6 md:px-12 pb-16 relative z-10 text-linen">
          <span className="inline-block px-4 py-1.5 bg-pink text-warm-black text-[10px] font-black uppercase tracking-widest rounded-full mb-4 shadow-sm select-none">
            {event.category}
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-[var(--color-linen)] leading-tight mb-4 select-none drop-shadow-md">
            {event.title}
          </h1>
          
          <div className="flex flex-wrap gap-6 text-sm text-[var(--color-linen)]/95 font-bold uppercase tracking-wider">
            <div className="flex items-center bg-[var(--color-plum)]/50 backdrop-blur-sm px-4 py-2 rounded-full border border-[var(--color-linen)]/10">
              <Calendar className="h-4 w-4 mr-2 text-[var(--color-sunshine)]" />
              {formatEventDate(event.start_date, { month: 'short', day: 'numeric' })} - {formatEventDate(event.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center bg-[var(--color-plum)]/50 backdrop-blur-sm px-4 py-2 rounded-full border border-[var(--color-linen)]/10">
              <MapPin className="h-4 w-4 mr-2 text-[var(--color-sunshine)]" />
              {event.location}
            </div>
            {event.age_range && (
              <div className="flex items-center bg-[var(--color-plum)]/50 backdrop-blur-sm px-4 py-2 rounded-full border border-[var(--color-linen)]/10">
                <Users className="h-4 w-4 mr-2 text-[var(--color-sunshine)]" />
                Ages {event.age_range}
              </div>
            )}
          </div>
        </div>

        {/* Decorative Wave bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 fill-[var(--color-linen)]">
            <path d="M985.66,92.83C906.67,72,823.78,31,741.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A855,855,0,0,1,0,58.38V120H1200V95.83C1132.19,118.92,1055.71,111.31,985.66,92.83Z" />
          </svg>
        </div>
      </div>

      {/* 2. Main Page Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Descriptions, Schedule, FAQs, Team */}
        <div className="lg:col-span-8 flex flex-col space-y-12">
          
          {/* Overview */}
          <section className="bg-[var(--color-linen)] rounded-3xl border border-[var(--color-plum)]/10 p-8 space-y-4">
            <h2 className="font-display text-3xl font-black text-[var(--color-plum)] flex items-center border-b border-[var(--color-plum)]/5 pb-3">
              About this Experience
            </h2>
            <p className="text-base sm:text-lg text-[var(--color-warm-black)]/85 leading-relaxed font-sans font-light whitespace-pre-wrap">
              {event.long_description || event.short_description}
            </p>
          </section>

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <section className="bg-[var(--color-linen)] rounded-3xl border border-[var(--color-plum)]/10 p-8 space-y-6">
              <h2 className="font-display text-3xl font-black text-[var(--color-plum)] flex items-center border-b border-[var(--color-plum)]/5 pb-3">
                What to Expect
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {event.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start text-sm text-[var(--color-warm-black)]/80 font-sans font-medium">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-pink)]/20 flex items-center justify-center text-[var(--color-plum)] font-black mr-3 text-xs mt-0.5 border border-[var(--color-pink)]/10 shadow-sm">
                      ✓
                    </span>
                    <span className="mt-0.5 leading-snug">{highlight}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Event Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <section className="bg-[var(--color-linen)] rounded-3xl border border-[var(--color-plum)]/10 p-8 space-y-8">
              <h2 className="font-display text-3xl font-black text-[var(--color-plum)] flex items-center border-b border-[var(--color-plum)]/5 pb-3">
                Daily Schedule
              </h2>
              <div className="border-l-2 border-[var(--color-plum)]/15 ml-4 pl-8 space-y-8">
                {event.schedule.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle Indicator */}
                    <span className="absolute -left-[39px] top-1.5 w-4.5 h-4.5 rounded-full bg-[var(--color-sunshine)] border-2 border-[var(--color-linen)] shadow-md group-hover:bg-[var(--color-pink)] transition-colors" />
                    
                    <span className="text-[10px] font-black text-[var(--color-pink)] uppercase tracking-widest block font-sans">
                      {item.time_label}
                    </span>
                    <h3 className="font-display text-xl font-bold text-[var(--color-plum)] mt-1 mb-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-[var(--color-warm-black)]/75 leading-relaxed font-sans font-light">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Collapsible FAQs */}
          {event.faqs && event.faqs.length > 0 && (
            <section className="bg-[var(--color-linen)] rounded-3xl border border-[var(--color-plum)]/10 p-8 space-y-6">
              <h2 className="font-display text-3xl font-black text-[var(--color-plum)] flex items-center border-b border-[var(--color-plum)]/5 pb-3">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {event.faqs.map((faq, index) => (
                  <details key={index} className="group border-b border-[var(--color-plum)]/10 pb-4 cursor-pointer">
                    <summary className="flex items-center justify-between font-display text-lg font-bold text-[var(--color-plum)] hover:text-[var(--color-pink)] list-none">
                      <span className="flex items-center">
                        <HelpCircle className="mr-3 h-5 w-5 text-[var(--color-pink)] flex-shrink-0" />
                        {faq.question}
                      </span>
                      <span className="text-xl group-open:rotate-45 transition-transform duration-250 text-[var(--color-plum)]/50">+</span>
                    </summary>
                    <p className="text-sm text-[var(--color-warm-black)]/80 font-sans leading-relaxed mt-3 pl-8 whitespace-pre-wrap font-light">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Hosts / Team */}
          {event.people && event.people.length > 0 && (
            <section className="bg-[var(--color-linen)] rounded-3xl border border-[var(--color-plum)]/10 p-8 space-y-6">
              <h2 className="font-display text-3xl font-black text-[var(--color-plum)] flex items-center border-b border-[var(--color-plum)]/5 pb-3">
                Counselors & Organizers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {event.people.map((person, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 bg-[var(--color-plum)]/5 rounded-2xl border border-[var(--color-plum)]/5">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-plum)]/10 flex-shrink-0 overflow-hidden flex items-center justify-center relative border border-[var(--color-plum)]/10 shadow-sm blob-2">
                      {person.image_url ? (
                        <Image 
                          src={person.image_url} 
                          alt={person.name} 
                          fill
                          className="object-cover" 
                        />
                      ) : (
                        <span className="font-display text-xl font-bold text-[var(--color-plum)]/50 select-none">
                          {person.name[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[var(--color-plum)]">{person.name}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-pink)] font-black font-sans block mb-1">
                        {person.role}
                      </span>
                      {person.bio && (
                        <p className="text-xs text-[var(--color-warm-black)]/70 leading-relaxed font-sans font-light">{person.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Scholarship details */}
          <section className="bg-[var(--color-sunshine)]/10 rounded-3xl border border-[var(--color-sunshine)]/25 p-6 flex items-start gap-4 shadow-sm">
            <AlertCircle className="h-6 w-6 text-[var(--color-pink)] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display text-lg font-black text-[var(--color-plum)]">Accessibility & Scholarships</h3>
              <p className="text-sm text-[var(--color-warm-black)]/80 font-sans mt-1 leading-relaxed font-light">
                We want Sanga to be accessible to everyone regardless of financial situation. If you need financial assistance or would like to apply for a scholarship, please contact us at <a href={`mailto:info@sangainitiative.org?subject=Scholarship Inquiry: ${event.title}`} className="underline text-[var(--color-plum)] font-black hover:text-[var(--color-pink)]">info@sangainitiative.org</a> before registering.
              </p>
            </div>
          </section>

        </div>

        {/* Right Column: Sticky Action Booking Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 bg-[var(--color-linen)] rounded-3xl border border-[var(--color-plum)]/15 shadow-md p-6 flex flex-col space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-warm-black)]/50 block font-sans">
                Registration Fee
              </span>
              <div className="text-4xl font-display font-black text-[var(--color-plum)]">{event.price}</div>
            </div>

            <div className="border-t border-[var(--color-plum)]/10 pt-4 space-y-4 font-sans text-sm">
              <div>
                <span className="font-black text-[var(--color-warm-black)]/50 text-[10px] block uppercase tracking-widest mb-1">Date</span>
                <span className="font-bold text-[var(--color-warm-black)]/80">{formatEventDate(event.start_date, { month: 'short', day: 'numeric' })} - {formatEventDate(event.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div>
                <span className="font-black text-[var(--color-warm-black)]/50 text-[10px] block uppercase tracking-widest mb-1">Location</span>
                <span className="font-bold text-[var(--color-warm-black)]/80">{event.location}</span>
              </div>
              {event.age_range && (
                <div>
                  <span className="font-black text-[var(--color-warm-black)]/50 text-[10px] block uppercase tracking-widest mb-1">Age Limit</span>
                  <span className="font-bold text-[var(--color-warm-black)]/80">Ages {event.age_range}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-4 border-t border-[var(--color-plum)]/10">
              {isOpen && (
                <Link
                  href={`/community?source=event&event=${encodeURIComponent(event.slug)}`}
                  className="w-full text-center px-6 py-4 bg-[var(--color-plum)] hover:bg-[var(--color-pink)] text-[var(--color-linen)] rounded-full font-black text-xs tracking-widest uppercase shadow-sm transition-colors"
                >
                  Register in the Community
                </Link>
              )}

              {isComingSoon && (
                <button
                  disabled
                  className="w-full text-center px-6 py-4 bg-[var(--color-sunshine)] text-[var(--color-plum)] rounded-full font-black text-xs tracking-widest uppercase cursor-not-allowed opacity-85 shadow-sm border border-[var(--color-pink)]/10"
                >
                  Coming Soon
                </button>
              )}

              {isClosed && (
                <button
                  disabled
                  className="w-full text-center px-6 py-4 bg-[var(--color-warm-black)]/10 text-[var(--color-warm-black)]/50 rounded-full font-black text-xs tracking-widest uppercase cursor-not-allowed border border-[var(--color-warm-black)]/10"
                >
                  Registration Closed
                </button>
              )}

              {isSoldOut && (
                <button
                  disabled
                  className="w-full text-center px-6 py-4 bg-[var(--color-pink)] text-[var(--color-linen)] rounded-full font-black text-xs tracking-widest uppercase cursor-not-allowed"
                >
                  Sold Out
                </button>
              )}

              {event.liability_form_url && (
                <a
                  href={event.liability_form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-center text-[var(--color-warm-black)]/60 hover:text-[var(--color-plum)] hover:underline font-medium mt-2"
                >
                  View Liability Waiver Form
                </a>
              )}
            </div>
            
            <p className="text-[10px] text-[var(--color-warm-black)]/50 text-center font-sans leading-normal font-light">
              Event registration and sign-in continue through the Sanga community.
            </p>
          </div>
        </div>

      </div>
    </article>
  );
}
