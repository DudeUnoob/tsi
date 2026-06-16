'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'Gatherings', path: '/gatherings' },
  { name: 'Store', path: '/store' },
  { name: 'Resources', path: '/resources' },
  { name: 'Support', path: '/support' },
  { name: 'Contact', path: '/contact' }
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile nav on path changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, isOpen]);

  return (
    <header 
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-linen/80 shadow-sm backdrop-blur-md border-b border-plum/5 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex flex-col group">
          <span className="font-display text-2xl font-bold tracking-tight text-plum group-hover:text-tangerine transition-colors">
            Sanga
          </span>
          <span className="text-[10px] tracking-wider uppercase text-warm-black/60 font-medium -mt-1 font-sans">
            A Vaishnava Youth Collective
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.path}
                href={link.path}
                className={`relative py-1 font-sans font-medium text-sm transition-colors duration-250 ${
                  isActive 
                    ? 'text-plum' 
                    : 'text-warm-black/80 hover:text-plum'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-sunshine rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA / WhatsApp Button */}
        <div className="hidden md:block">
          <a
            href="https://chat.whatsapp.com/GwqDQlpsQHxAuDYsK7xVRx?s=cl&p=a&ilr=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider bg-plum text-linen rounded-full hover:bg-tangerine hover:text-linen hover:shadow-md transition-all duration-200"
          >
            Join WhatsApp
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-plum hover:text-tangerine focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 w-full bg-linen border-b border-plum/10 shadow-lg px-6 py-6 md:hidden flex flex-col space-y-4"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-semibold py-2 border-b border-plum/5 ${
                    isActive ? 'text-plum pl-2 border-l-2 border-l-sunshine' : 'text-warm-black/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            <a
              href="https://chat.whatsapp.com/GwqDQlpsQHxAuDYsK7xVRx?s=cl&p=a&ilr=1"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center px-4 py-3 text-sm font-bold uppercase tracking-wider bg-plum text-linen rounded-full hover:bg-tangerine transition-all"
            >
              Join WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
