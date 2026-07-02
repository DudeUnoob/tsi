'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_PALETTES, ThemePalette } from '@/lib/mockData';

interface ThemeContextType {
  currentPaletteKey: string;
  palette: ThemePalette;
  setTheme: (key: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialPaletteKey = 'default',
}: {
  children: React.ReactNode;
  initialPaletteKey?: string;
}) {
  const [currentPaletteKey, setCurrentPaletteKey] = useState<string>(initialPaletteKey);

  // Synchronize with localStorage and cookies on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sanga_theme_palette');
      if (stored && THEME_PALETTES[stored]) {
        setCurrentPaletteKey(stored);
        document.cookie = `sanga_palette=${stored}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch (e) {
      console.error('Failed to read theme from localStorage', e);
    }
  }, []);

  const setTheme = (key: string) => {
    const validKey = THEME_PALETTES[key] ? key : 'default';
    setCurrentPaletteKey(validKey);
    try {
      localStorage.setItem('sanga_theme_palette', validKey);
      document.cookie = `sanga_palette=${validKey}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.error('Failed to set theme in localStorage/cookie', e);
    }
  };

  const palette = THEME_PALETTES[currentPaletteKey] || THEME_PALETTES.default;

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
