import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/lib/supabase';
import { Calendar, MapPin, Users, AlertCircle, HelpCircle, ArrowLeft, ArrowUpRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0;

export default async function GatheringDetailPage({ params }: PageProps) {
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
    <article className="min-h-screen bg-linen pb-24 font-sans">
      {/* 1. Header Banner & Hero Image */}
      <div className="relative w-full h-[55vh] md:h-[65vh] bg-plum overflow-hidden">
        {event.hero_image ? (
          <Image 
            src={event.hero_image} 
            alt={event.title}
            fill
            className="object-cover opacity-85"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-plum via-sienna to-warm-black opacity-90" />
        )}
        
        {/* Top Breadcrumb Overlay */}
        <div className="absolute top-6 left-6 md:left-12 z-10">
          <Link 
            href="/gatherings"
            className="inline-flex items-center px-4 py-2 bg-linen/95 hover:bg-linen text-plum text-xs font-bold uppercase tracking-wider rounded-full shadow-sm transition-all"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Catalog
          </Link>
        </div>

        {/* Text Details Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-warm-black/90 via-warm-black/30 to-transparent flex items-end">
          <div className="max-w-7xl w-full mx-auto px-6 md:px-12 pb-12 text-linen">
            <span className="inline-block px-3 py-1 bg-pink text-warm-black text-[10px] font-bold uppercase tracking-wider rounded-full mb-4">
              {event.category}
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-linen leading-tight mb-4">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap gap-6 text-sm text-linen/90 font-medium">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-sunshine" />
                {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-sunshine" />
                {event.location}
              </div>
              {event.age_range && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-sunshine" />
                  Ages {event.age_range}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Page Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Descriptions, Schedule, FAQs, Team */}
        <div className="lg:col-span-8 flex flex-col space-y-12">
          
          {/* Overview */}
          <section className="bg-linen rounded-3xl border border-plum/10 p-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-plum mb-4">
              About this Experience
            </h2>
            <p className="text-base sm:text-lg text-warm-black/85 leading-relaxed font-sans font-light whitespace-pre-wrap">
              {event.long_description || event.short_description}
            </p>
          </section>

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <section className="bg-linen rounded-3xl border border-plum/10 p-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-plum mb-6">
                What to Expect
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start text-sm text-warm-black/80 font-sans">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink/20 flex items-center justify-center text-plum font-bold mr-3 text-xs mt-0.5">
                      &bull;
                    </span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Event Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <section className="bg-linen rounded-3xl border border-plum/10 p-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-plum mb-6">
                Daily Schedule
              </h2>
              <div className="border-l border-plum/15 ml-4 pl-6 space-y-8">
                {event.schedule.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Indicator */}
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-sunshine border border-linen" />
                    
                    <span className="text-xs font-bold text-tangerine uppercase tracking-wider block font-sans">
                      {item.time_label}
                    </span>
                    <h3 className="font-display text-xl font-bold text-plum mt-1 mb-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light">
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
            <section className="bg-linen rounded-3xl border border-plum/10 p-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-plum mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {event.faqs.map((faq, index) => (
                  <details key={index} className="group border-b border-plum/10 pb-4 cursor-pointer">
                    <summary className="flex items-center justify-between font-display text-lg font-bold text-plum hover:text-tangerine list-none">
                      <span className="flex items-center">
                        <HelpCircle className="mr-2 h-5 w-5 text-pink flex-shrink-0" />
                        {faq.question}
                      </span>
                      <span className="text-2xl group-open:rotate-45 transition-transform duration-200 text-plum/50">+</span>
                    </summary>
                    <p className="text-sm text-warm-black/80 font-sans leading-relaxed mt-3 pl-7 whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Hosts / Team */}
          {event.people && event.people.length > 0 && (
            <section className="bg-linen rounded-3xl border border-plum/10 p-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-plum mb-6">
                Counselors & Organizers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {event.people.map((person, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 bg-plum/5 rounded-2xl border border-plum/5">
                    <div className="w-16 h-16 rounded-full bg-plum/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {person.image_url ? (
                        <Image 
                          src={person.image_url} 
                          alt={person.name} 
                          width={64} 
                          height={64} 
                          className="object-cover" 
                        />
                      ) : (
                        <span className="font-display text-xl font-bold text-plum/50">
                          {person.name[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-plum">{person.name}</h3>
                      <span className="text-xs uppercase tracking-wider text-tangerine font-bold font-sans block mb-1">
                        {person.role}
                      </span>
                      {person.bio && (
                        <p className="text-xs text-warm-black/75 leading-relaxed font-sans">{person.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Scholarship details */}
          <section className="bg-sunshine/5 rounded-3xl border border-sunshine/10 p-6 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-tangerine flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display text-lg font-bold text-plum">Accessibility & Scholarships</h3>
              <p className="text-sm text-warm-black/80 font-sans mt-1 leading-relaxed">
                We want Sanga to be accessible to everyone regardless of financial situation. If you need financial assistance or would like to apply for a scholarship, please contact us at <a href={`mailto:info@sangainitiative.org?subject=Scholarship Inquiry: ${event.title}`} className="underline text-plum font-bold hover:text-tangerine">info@sangainitiative.org</a> before registering.
              </p>
            </div>
          </section>

        </div>

        {/* Right Column: Sticky Action Booking Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 bg-linen rounded-3xl border border-plum/15 shadow-md p-6 flex flex-col space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-warm-black/50 block font-sans">
                Price / Cost
              </span>
              <div className="text-3xl font-display font-bold text-plum">{event.price}</div>
            </div>

            <div className="border-t border-plum/5 pt-4 space-y-3 font-sans text-sm">
              <div>
                <span className="font-bold text-warm-black/50 text-xs block uppercase">Date</span>
                <span className="font-medium text-warm-black/80">{new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div>
                <span className="font-bold text-warm-black/50 text-xs block uppercase">Location</span>
                <span className="font-medium text-warm-black/80">{event.location}</span>
              </div>
              {event.age_range && (
                <div>
                  <span className="font-bold text-warm-black/50 text-xs block uppercase">Age Limit</span>
                  <span className="font-medium text-warm-black/80">Ages {event.age_range}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-4 border-t border-plum/5">
              {/* TODO: Replacement of the external urls with native Stripe Checkout session redirects can be done here.
                  Instead of referencing external urls, trigger a server action generating a Stripe Checkout Session
                  pointing to /api/checkout and redirecting to the payment portal. */}
              {isOpen && event.external_checkout_url && (
                <a
                  href={event.external_checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center px-6 py-4 bg-plum text-linen hover:bg-tangerine rounded-full font-bold text-sm tracking-wide uppercase shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center"
                >
                  Register Now <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </a>
              )}

              {isOpen && event.payment_url && (
                <a
                  href={event.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center px-6 py-4 bg-linen border border-plum text-plum hover:bg-plum/5 rounded-full font-bold text-sm tracking-wide uppercase transition-all inline-flex items-center justify-center"
                >
                  Make Payment
                </a>
              )}

              {isComingSoon && (
                <button
                  disabled
                  className="w-full text-center px-6 py-4 bg-sunshine text-warm-black rounded-full font-bold text-sm tracking-wide uppercase cursor-not-allowed opacity-85"
                >
                  Coming Soon
                </button>
              )}

              {isClosed && (
                <button
                  disabled
                  className="w-full text-center px-6 py-4 bg-warm-black/10 text-warm-black/50 rounded-full font-bold text-sm tracking-wide uppercase cursor-not-allowed"
                >
                  Registration Closed
                </button>
              )}

              {isSoldOut && (
                <button
                  disabled
                  className="w-full text-center px-6 py-4 bg-tangerine text-linen rounded-full font-bold text-sm tracking-wide uppercase cursor-not-allowed"
                >
                  Sold Out
                </button>
              )}

              {event.liability_form_url && (
                <a
                  href={event.liability_form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-center text-warm-black/60 hover:text-plum underline mt-2"
                >
                  View Liability Waiver Form
                </a>
              )}
            </div>
            
            <p className="text-[10px] text-warm-black/50 text-center font-sans leading-normal">
              By registering, you agree to Sanga&apos;s community rules. Refunds are permitted up to 30 days prior to start date.
            </p>
          </div>
        </div>

      </div>
    </article>
  );
}
