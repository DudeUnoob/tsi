import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import {
  CANONICAL_SITE_URL,
  getDeploymentUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/seo";

// Only the weights the app actually renders are declared. The obliques and the
// 100/200/300 weights were dead: nothing in src/ uses an `italic`, `font-thin`
// or `font-extralight` class, so every one of those @font-face rules was CSS
// the browser parsed and never used.
const nichrome = localFont({
  src: [
    {
      path: "./fonts/MDNichrome-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-Black.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-Ultra.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-nichrome",
  display: "swap",
  preload: false,
});

const visby = localFont({
  src: [
    {
      path: "./fonts/Visby-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Visby-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Visby-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Visby-DemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Visby-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Visby-Heavy.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-visby",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(getDeploymentUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "The Sanga Initiative", url: CANONICAL_SITE_URL }],
  creator: "The Sanga Initiative",
  publisher: "The Sanga Initiative",
  category: "community",
  keywords: [
    "Sanga",
    "The Sanga Initiative",
    "Vaishnava youth",
    "Krishna consciousness",
    "Bhakti yoga",
    "Kirtan",
    "Vaishnava retreats",
    "Youth spiritual community",
  ],
  alternates: {
    canonical: CANONICAL_SITE_URL,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: CANONICAL_SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Deliberately reads no request-scoped data (no cookies/headers) and awaits
  // nothing: that is what lets every route render from the static/ISR cache
  // instead of hitting Firestore on each request. ThemeProvider hardcodes the
  // 'sunset' palette, so the old cookie lookup fed a value nothing consumed.
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NonprofitOrganization',
    name: 'The Sanga Initiative',
    alternateName: SITE_NAME,
    url: CANONICAL_SITE_URL,
    logo: `${CANONICAL_SITE_URL}/sanga-wordmark-2.svg`,
    description: SITE_DESCRIPTION,
    email: 'info@sangainitiative.org',
    nonprofitStatus: 'Nonprofit501c3',
    sameAs: [
      'https://www.instagram.com/thesangainitiative/',
      'https://www.facebook.com/sangainitiative',
    ],
  };

  return (
    <html
      lang="en"
      className={`${nichrome.variable} ${visby.variable} h-full antialiased`}
    >
      <head>
        {/* The hero and event photos are served from the Squarespace CDN, and
            the LCP candidate is one of them. Opening the DNS/TCP/TLS connection
            up front removes that handshake from the image's critical path. */}
        <link rel="preconnect" href="https://images.squarespace-cdn.com" />
        <link rel="dns-prefetch" href="https://images.squarespace-cdn.com" />
      </head>
      <body className="min-h-full flex flex-col bg-linen text-warm-black selection:bg-pink/30 selection:text-plum">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ThemeProvider>
          <CartProvider>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
