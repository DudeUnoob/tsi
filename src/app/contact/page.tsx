import React from 'react';
import { getSiteSettings } from '@/lib/supabase';
import ContactForm from '@/components/ContactForm';
import { Mail, MessageCircle, Heart, Sparkles } from 'lucide-react';

export const revalidate = 0;

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="bg-linen min-h-screen font-sans pb-24 text-warm-black">
      {/* Wave Header Section */}
      <div className="relative bg-plum text-linen pt-16 pb-32 overflow-hidden">
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-sunshine/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-pink/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sunshine/20 border border-sunshine/40 text-sunshine text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Connect
          </span>
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
            Get in <span className="text-sunshine">Touch</span>
          </h1>
          <p className="text-lg sm:text-xl text-linen/85 max-w-2xl mx-auto font-light leading-relaxed">
            Have a question about an upcoming retreat? Need help with registrations or bookings? Or simply want to learn more about Sanga offerings? Drop us a line.
          </p>
        </div>

        {/* Wave Border */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-12 text-linen fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,100 600,20 900,80 L1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Form Container */}
          <div className="lg:col-span-7 bg-linen p-8 md:p-10 rounded-[2.5rem] border border-plum/10 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-sunshine/5 rounded-full pointer-events-none" />
            <h2 className="font-display text-3xl font-bold text-plum mb-8 relative z-10 flex items-center gap-2">
              Send a Message
            </h2>
            <div className="relative z-10">
              <ContactForm />
            </div>
          </div>

          {/* Right Column: Contact Details */}
          <div className="lg:col-span-5 space-y-8">
            {/* Email Card */}
            <div className="bg-linen p-8 rounded-[2rem] border border-plum/10 space-y-4 hover:border-plum/30 transition-all duration-300 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink/15 rounded-2xl text-plum">
                  <Mail className="h-6 w-6 text-plum" />
                </div>
                <h3 className="font-display text-xl font-bold text-plum">Contact Email</h3>
              </div>
              <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                For general support, volunteer signups, or billing questions, write directly to:
              </p>
              <a 
                href={`mailto:${settings.contact_email}`} 
                className="inline-block text-lg font-bold text-plum hover:text-pink border-b border-plum/10 pb-0.5 transition-colors"
              >
                {settings.contact_email}
              </a>
            </div>

            {/* WhatsApp Hub */}
            <div className="bg-linen p-8 rounded-[2rem] border border-plum/10 space-y-4 hover:border-plum/30 transition-all duration-300 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sunshine/15 rounded-2xl text-plum">
                  <MessageCircle className="h-6 w-6 text-plum" />
                </div>
                <h3 className="font-display text-xl font-bold text-plum">WhatsApp Hub</h3>
              </div>
              <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                The fastest way to connect with community coordinators and other members is through our WhatsApp Community:
              </p>
              <a
                href={settings.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-plum hover:opacity-90 text-linen font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-all duration-300"
              >
                Join WhatsApp Group
              </a>
            </div>

            {/* Social Accounts */}
            <div className="bg-linen p-8 rounded-[2rem] border border-plum/10 space-y-4 hover:border-plum/30 transition-all duration-300 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sunshine/15 rounded-2xl text-plum">
                  <Heart className="h-6 w-6 text-plum" />
                </div>
                <h3 className="font-display text-xl font-bold text-plum">Follow Our Journey</h3>
              </div>
              <p className="text-sm text-warm-black/85 leading-relaxed font-sans font-light">
                Follow Sanga online to see announcements, photos, and updates from across regions.
              </p>
              <div className="flex items-center gap-4 text-sm pt-2">
                <a 
                  href={settings.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-plum hover:text-[#FF7DB4] font-semibold border-b border-plum/10 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                  Instagram
                </a>
                <span className="text-plum/20">|</span>
                <a 
                  href={settings.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-plum hover:text-[#2660FF] font-semibold border-b border-plum/10 transition-colors"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                  Facebook
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
