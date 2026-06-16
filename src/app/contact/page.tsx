import React from 'react';
import { getSiteSettings } from '@/lib/supabase';
import ContactForm from '@/components/ContactForm';
import { Mail, MessageCircle, Heart } from 'lucide-react';

export const revalidate = 0;

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="bg-linen min-h-screen py-16 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-wider text-tangerine font-bold font-sans">
            Connect
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-plum mt-2 mb-6">
            Get in Touch
          </h1>
          <p className="text-base sm:text-lg text-warm-black/75 leading-relaxed font-sans">
            Have a question about an upcoming retreat? Need help with registrations or bookings? Or simply want to learn more about Sanga offerings? Drop us a line.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-linen p-8 rounded-3xl border border-plum/10 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-plum mb-6">Send a Message</h2>
            <ContactForm />
          </div>

          {/* Right Column: Contact Details */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            {/* Email card */}
            <div className="bg-linen p-6 rounded-3xl border border-plum/10 space-y-4">
              <h3 className="font-display text-lg font-bold text-plum flex items-center">
                <Mail className="h-5 w-5 mr-2 text-pink" /> Contact Email
              </h3>
              <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light">
                For general support, volunteer signups, or billing questions, write directly to:
              </p>
              <a 
                href={`mailto:${settings.contact_email}`} 
                className="block text-base font-bold text-plum hover:underline hover:text-tangerine"
              >
                {settings.contact_email}
              </a>
            </div>

            {/* WhatsApp Hub */}
            <div className="bg-linen p-6 rounded-3xl border border-plum/10 space-y-4">
              <h3 className="font-display text-lg font-bold text-plum flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-mint-green" /> Sanga WhatsApp Hub
              </h3>
              <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light">
                The fastest way to connect with community coordinators and other members is through our WhatsApp Community:
              </p>
              <a
                href={settings.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-mint-green hover:bg-grass-green text-warm-black hover:text-linen text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-200"
              >
                Join WhatsApp Group
              </a>
            </div>

            {/* Social Accounts */}
            <div className="bg-linen p-6 rounded-3xl border border-plum/10 space-y-4">
              <h3 className="font-display text-lg font-bold text-plum flex items-center">
                <Heart className="h-5 w-5 mr-2 text-tangerine" /> Follow Our Journey
              </h3>
              <p className="text-sm text-warm-black/75 leading-relaxed font-sans font-light">
                Follow Sanga online to see announcements, photos, and updates from across regions.
              </p>
              <div className="flex items-center space-x-3 text-sm">
                <a 
                  href={settings.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-plum hover:text-pink font-semibold border-b border-plum/10"
                >
                  <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  className="flex items-center text-plum hover:text-pink font-semibold border-b border-plum/10"
                >
                  <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
