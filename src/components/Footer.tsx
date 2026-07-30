'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-plum text-linen pt-16 pb-8 border-t border-linen/10 font-sans">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-4 flex flex-col space-y-4">
          <Link
            href="/"
            className="group w-fit transition-transform hover:-translate-y-0.5"
          >
            <Image
              src="/sanga-wordmark-2.svg"
              alt="Sanga - A Vaishnava Youth Collective"
              width={172}
              height={76}
              className="h-auto w-[172px] select-none"
            />
          </Link>
          <p className="text-sm text-linen/70 leading-relaxed max-w-sm font-light">
            Creating spaces for friendship, growth, and shared experience in Krishna consciousness. Built through people, not programmes.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <a 
              href="https://www.instagram.com/thesangainitiative/?hl=en" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 bg-[var(--color-linen)]/5 hover:bg-[var(--color-pink)] hover:text-[var(--color-warm-black)] rounded-full transition-all duration-200"
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
              className="p-2.5 bg-[var(--color-linen)]/5 hover:bg-[var(--color-sunshine)] hover:text-[var(--color-warm-black)] rounded-full transition-all duration-200"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a 
              href="mailto:info@sangainitiative.org"
              className="p-2.5 bg-[var(--color-linen)]/5 hover:bg-[var(--color-sunshine)] hover:text-[var(--color-warm-black)] rounded-full transition-all duration-200"
              aria-label="Email Us"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Links Column */}
        <div className="col-span-1 md:col-span-3">
          <h3 className="font-display text-lg font-bold text-[var(--color-linen)] mb-4 uppercase tracking-widest text-xs">Quick Links</h3>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <li>
              <Link href="/" className="text-[var(--color-linen)]/75 hover:text-[var(--color-pink)] transition-colors font-medium">
                Home
              </Link>
            </li>
            <li>
              <Link href="/events" className="text-[var(--color-linen)]/75 hover:text-[var(--color-pink)] transition-colors font-medium">
                Events
              </Link>
            </li>
            <li>
              <Link href="/gallery" className="text-[var(--color-linen)]/75 hover:text-[var(--color-pink)] transition-colors font-medium">
                Gallery
              </Link>
            </li>
            <li>
              <Link href="/education" className="text-[var(--color-linen)]/75 hover:text-[var(--color-pink)] transition-colors font-medium">
                Education
              </Link>
            </li>
            <li>
              <Link href="/calendar" className="text-[var(--color-linen)]/75 hover:text-[var(--color-pink)] transition-colors font-medium">
                Calendar
              </Link>
            </li>
            <li>
              <Link href="/store" className="text-[var(--color-linen)]/75 hover:text-[var(--color-pink)] transition-colors font-medium">
                Store
              </Link>
            </li>
            <li>
              <Link href="/support" className="text-[var(--color-linen)]/75 hover:text-[var(--color-pink)] transition-colors font-medium">
                Support
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-[var(--color-linen)]/75 hover:text-[var(--color-pink)] transition-colors font-medium">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Community Column */}
        <div className="col-span-1 md:col-span-5 flex flex-col space-y-4">
          <h3 className="font-display text-lg font-bold text-[var(--color-linen)] uppercase tracking-widest text-xs">Join our community</h3>
          <p className="text-sm text-[var(--color-linen)]/70 leading-relaxed font-light">
            Stay connected with Sanga between retreats, local events, and online programs.
          </p>
          <a
            href="https://sanga.mn.co/share/Dl_EkHm4p0YlMWQU?utm_source=manual"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 inline-flex w-fit min-w-60 items-center justify-center gap-3 rounded-full bg-[var(--color-linen)] px-6 py-4 text-sm font-black text-[var(--color-plum)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-sunshine)] hover:text-[var(--color-warm-black)] active:translate-y-0"
          >
            Join the community
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-[var(--color-linen)]/10 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--color-linen)]/50 gap-4">
        <div className="flex flex-col items-center md:items-start space-y-1">
          <p>&copy; {new Date().getFullYear()} The Sanga Initiative. All rights reserved.</p>
          <p className="text-[10px] text-[var(--color-linen)]/40 leading-relaxed">
            The Sanga Initiative (TSI) is a registered 501(c)(3) non-profit organization. Donations are tax-deductible to the extent allowed by law.
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link href="/admin" className="hover:text-[var(--color-pink)] transition-colors font-medium">
            Staff Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
