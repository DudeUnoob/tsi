'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'Home', path: '/' },
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
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFA526] text-[#6E0B64] transition-all duration-300 py-4 shadow-sm border-b border-[#6E0B64]/10">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Desktop Header: Center Stacked Layout */}
        <div className="hidden md:flex flex-col items-center space-y-4">
          {/* Logo Section */}
          <Link href="/" className="flex flex-col items-center group">
            <span className="font-display text-4xl font-black tracking-tight text-[#6E0B64] lowercase select-none leading-none group-hover:opacity-90 transition-opacity">
              sanga
            </span>
            <span className="text-[10px] tracking-widest uppercase text-[#6E0B64]/80 font-black mt-1 font-sans">
              A Vaishnava Youth Collective
            </span>
          </Link>
          
          {/* Navigation Links */}
          <nav className="flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-xs uppercase font-black tracking-widest transition-all ${
                    isActive
                      ? 'text-[#6E0B64] border-b-2 border-[#6E0B64] pb-0.5'
                      : 'text-[#6E0B64]/80 hover:text-[#6E0B64] hover:opacity-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Header: Row Layout */}
        <div className="flex md:hidden items-center justify-between">
          <Link href="/" className="flex flex-col group">
            <span className="font-display text-3xl font-black tracking-tight text-[#6E0B64] lowercase select-none leading-none">
              sanga
            </span>
            <span className="text-[9px] tracking-widest uppercase text-[#6E0B64]/80 font-black mt-0.5 font-sans">
              A Vaishnava Youth Collective
            </span>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-[#6E0B64] hover:text-[#E65C17] focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute top-full left-0 w-full bg-[#FFA526] border-t border-[#6E0B64]/10 shadow-lg px-6 py-6 md:hidden flex flex-col space-y-4 z-50 overflow-hidden"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-sm uppercase font-black tracking-widest py-2 border-b border-[#6E0B64]/10 ${
                    isActive ? 'text-[#6E0B64] pl-2 border-l-4 border-l-[#6E0B64]' : 'text-[#6E0B64]/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
