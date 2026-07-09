'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_PALETTES, ThemePalette } from '@/lib/mockData';

interface ThemeContextType {
  currentPaletteKey: string;
  palette: ThemePalette;
  setTheme: (key: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

import { usePathname } from 'next/navigation';

export function ThemeProvider({
  children,
  initialPaletteKey = 'sunset',
}: {
  children: React.ReactNode;
  initialPaletteKey?: string;
}) {
  const pathname = usePathname();
  const currentPaletteKey = 'sunset';

  useEffect(() => {
    try {
      localStorage.setItem('sanga_theme_palette', 'sunset');
      document.cookie = `sanga_palette=sunset; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.error('Failed to sync theme in localStorage/cookie', e);
    }
  }, []);

  const setTheme = (key: string) => {
    // No-op to lock the theme exclusively to sunset
  };

  // Home Page gets original magenta/orange palette
  const homePalette = {
    name: "Sunset Gradient",
    background: "#FFEFBF", // Linen
    foreground: "#1E1D1B", // Warm Black
    primary: "#C83B82",    // Magenta
    secondary: "#F26E27",  // Orange
    accent: "#6E0B64"      // Deep purple/plum
  };

  // Other pages get the warm sunset orange/amber palette
  const innerPalette = {
    name: "Sunset Gradient",
    background: "#FFEFBF", // Linen
    foreground: "#1E1D1B", // Warm Black
    primary: "#D9480F",    // Sunset Orange
    secondary: "#F59E0B",  // Warm Amber
    accent: "#FF8A65"      // Peach/coral
  };

  const palette = pathname === '/' ? homePalette : innerPalette;

  return (
    <ThemeContext.Provider value={{ currentPaletteKey, palette, setTheme }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --background: ${palette.background};
            --foreground: ${palette.foreground};
            --color-linen: ${palette.background};
            --color-warm-black: ${palette.foreground};
            --color-plum: ${palette.primary};
            --color-pink: ${palette.secondary};
            --color-sunshine: ${palette.accent};
          }
          body {
            background-color: var(--background) !important;
            color: var(--foreground) !important;
          }
        `
      }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
