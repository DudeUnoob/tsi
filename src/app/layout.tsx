import type { Metadata } from "next";
import { Fredoka, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteSettings } from "@/lib/supabase";
import { THEME_PALETTES } from "@/lib/mockData";

const displayFont = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sanga | A Vaishnava Youth Collective",
  description: "Sanga is a Vaishnava Youth Collective for friendship, growth, and shared experience in Krishna consciousness.",
  keywords: ["Sanga", "Vaishnava", "Youth Collective", "Krishna consciousness", "Bhakti Yoga", "Retreats", "Camp Ignite"],
  openGraph: {
    title: "Sanga | A Vaishnava Youth Collective",
    description: "Creating spaces for friendship, growth, and shared experience in Krishna consciousness.",
    url: "https://www.sangainitiative.org",
    siteName: "Sanga",
    type: "website",
    images: [
      {
        url: "https://images.squarespace-cdn.com/content/v1/55c3a641e4b01d44af64ae03/1515991554064-56AD4XMHTIJODR105R7N/Copy+of+TSI_logo_rev.jpg",
        width: 1200,
        height: 630,
        alt: "Sanga Logo",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanga | A Vaishnava Youth Collective",
    description: "Creating spaces for friendship, growth, and shared experience in Krishna consciousness.",
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const paletteKey = settings.color_palette || 'default';
  const palette = THEME_PALETTES[paletteKey] || THEME_PALETTES.default;

  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
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
          h1, h2, h3, h4, h5, h6 {
            color: var(--color-plum) !important;
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col bg-linen text-warm-black selection:bg-pink/30 selection:text-plum">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
