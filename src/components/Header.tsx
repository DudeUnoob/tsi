'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';

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
  const { cartCount } = useCart();

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

  const { currentPaletteKey } = useTheme();
  const isDefaultTheme = currentPaletteKey === 'default';

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 py-4 relative ${
      isDefaultTheme ? 'bg-sunshine text-plum' : 'bg-linen text-plum'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Desktop Header: Center Stacked Layout */}
        <div className="hidden md:flex flex-col items-center space-y-4">
          {/* Logo Section */}
          <Link href="/" className="flex flex-col items-center group">
            <span className="font-display text-4xl font-black tracking-tight text-plum lowercase select-none leading-none group-hover:opacity-90 transition-opacity">
              sanga
            </span>
          </Link>
          {/* Navigation Links */}
          <nav className="flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = link.path === '/' 
                ? pathname === '/' 
                : pathname === link.path || pathname.startsWith(link.path + '/');
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-xs uppercase font-black tracking-widest transition-all ${
                    isActive
                      ? 'text-plum border-b-2 border-plum pb-0.5'
                      : 'text-plum/80 hover:text-plum hover:opacity-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Desktop Cart Indicator inline with navigation links */}
            <Link
              href="/cart"
              className={`relative p-1.5 text-plum hover:text-pink transition-all flex items-center justify-center cursor-pointer ml-2 ${
                pathname === '/cart' ? 'border-b-2 border-plum pb-0.5' : ''
              }`}
              aria-label="View shopping cart"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink text-linen text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm select-none">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Mobile Header: Row Layout */}
        <div className="flex md:hidden items-center justify-between">
          <Link href="/" className="flex flex-col group">
            <span className="font-display text-3xl font-black tracking-tight text-plum lowercase select-none leading-none">
              sanga
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            {/* Mobile Cart Indicator */}
            <Link
              href="/cart"
              className={`relative p-2 text-plum hover:text-pink transition-all flex items-center justify-center cursor-pointer ${
                pathname === '/cart' ? 'text-plum scale-105' : ''
              }`}
              aria-label="View shopping cart"
            >
              <ShoppingBag className="h-5.5 w-5.5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-pink text-linen text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm select-none">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-plum hover:text-pink focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
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
            className={`absolute top-full left-0 w-full border-t border-plum/10 shadow-lg px-6 py-6 md:hidden flex flex-col space-y-4 z-50 overflow-hidden ${
              isDefaultTheme ? 'bg-sunshine' : 'bg-linen'
            }`}
          >
            {navLinks.map((link) => {
              const isActive = link.path === '/' 
                ? pathname === '/' 
                : pathname === link.path || pathname.startsWith(link.path + '/');
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-sm uppercase font-black tracking-widest py-2 border-b border-plum/10 ${
                    isActive ? 'text-plum pl-2 border-l-4 border-l-plum' : 'text-plum/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Organic Curved Bottom Divider */}
      <div 
        className="absolute top-full left-0 right-0 hidden w-full overflow-hidden leading-none pointer-events-none z-30 md:block"
        style={{ filter: 'drop-shadow(0 6px 5px rgba(0,0,0,0.04))' }}
      >
        <svg 
          className="relative block w-full h-16 text-linen fill-current" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path d="M0,0 C26.9,4.75,55.05,16.35,80,25.23C135.66,45.09,194.3,55.57,253,58.38A855,855,0,0,0,321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3 L1200,0 L0,0 Z" />
        </svg>
        <svg 
          className="absolute top-0 left-0 w-full h-16 text-plum/10 stroke-current fill-none" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          strokeWidth="1.5"
        >
          <path d="M0,0 C26.9,4.75,55.05,16.35,80,25.23C135.66,45.09,194.3,55.57,253,58.38A855,855,0,0,0,321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3" />
        </svg>
      </div>
    </header>
  );
}
