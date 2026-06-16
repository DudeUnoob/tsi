'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { subscribeNewsletter } from '@/lib/supabase';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await subscribeNewsletter(email);
      if (res.success) {
        setStatus('success');
        setEmail('');
        setMessage(res.message);
      } else {
        setStatus('error');
        setMessage(res.message);
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <footer className="bg-warm-black text-linen pt-16 pb-8 border-t border-plum/10 font-sans">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-4 flex flex-col space-y-4">
          <Link href="/" className="flex flex-col">
            <span className="font-display text-3xl font-bold tracking-tight text-linen">
              Sanga
            </span>
            <span className="text-xs tracking-wider uppercase text-linen/60 font-semibold -mt-1">
              A Vaishnava Youth Collective
            </span>
          </Link>
          <p className="text-sm text-linen/70 leading-relaxed max-w-sm">
            Creating spaces for friendship, growth, and shared experience in Krishna consciousness. Built through people, not programmes.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <a 
              href="https://www.instagram.com/thesangainitiative/?hl=en" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-linen/5 hover:bg-pink hover:text-warm-black rounded-full transition-all duration-200"
              aria-label="Instagram"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a 
              href="http://www.facebook.com/sangainitiative" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-linen/5 hover:bg-sunshine hover:text-warm-black rounded-full transition-all duration-200"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a 
              href="mailto:info@sangainitiative.org"
              className="p-2 bg-linen/5 hover:bg-sky-blue hover:text-warm-black rounded-full transition-all duration-200"
              aria-label="Email Us"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Links Column */}
        <div className="col-span-1 md:col-span-3">
          <h3 className="font-display text-lg font-semibold text-linen/95 mb-4">Quick Links</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/gatherings" className="text-linen/70 hover:text-pink transition-colors">
                Gatherings & Retreats
              </Link>
            </li>
            <li>
              <Link href="/store" className="text-linen/70 hover:text-pink transition-colors">
                Merch Store
              </Link>
            </li>
            <li>
              <Link href="/resources" className="text-linen/70 hover:text-pink transition-colors">
                Reading Resources
              </Link>
            </li>
            <li>
              <Link href="/support" className="text-linen/70 hover:text-pink transition-colors">
                Support / Donate
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-linen/70 hover:text-pink transition-colors">
                Get in Touch
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="col-span-1 md:col-span-5 flex flex-col space-y-4">
          <h3 className="font-display text-lg font-semibold text-linen/95">Join our newsletter</h3>
          <p className="text-sm text-linen/70 leading-relaxed">
            Stay updated on upcoming retreats, local regionals, and digital gatherings.
          </p>
          
          <form onSubmit={handleSubscribe} className="relative flex items-center mt-2">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              required
              className="w-full px-4 py-3 bg-linen/5 border border-linen/15 rounded-full text-sm text-linen placeholder-linen/40 focus:outline-none focus:border-pink/50 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="absolute right-1 p-2 bg-pink hover:bg-sunshine text-warm-black rounded-full hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Subscribe"
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </form>

          {status === 'success' && (
            <p className="text-xs text-mint-green font-medium animate-fadeIn">{message}</p>
          )}
          {status === 'error' && (
            <p className="text-xs text-tangerine font-medium animate-fadeIn">{message}</p>
          )}
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-linen/10 flex flex-col md:flex-row items-center justify-between text-xs text-linen/50 gap-4">
        <div className="flex flex-col items-center md:items-start space-y-1">
          <p>&copy; {new Date().getFullYear()} The Sanga Initiative. All rights reserved.</p>
          <p className="text-[10px] text-linen/40 leading-relaxed">
            The Sanga Initiative (TSI) is a registered 501(c)(3) non-profit organization. Donations are tax-deductible to the extent allowed by law.
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link href="/admin" className="hover:text-pink transition-colors">
            Staff Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
