import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteSettings } from "@/lib/firebase";
import { cookies } from "next/headers";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import {
  CANONICAL_SITE_URL,
  getDeploymentUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/seo";

const nichrome = localFont({
  src: [
    {
      path: "./fonts/MDNichrome-Infra.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-InfraOblique.woff2",
      weight: "100",
      style: "italic",
    },
    {
      path: "./fonts/MDNichrome-Thin.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-ThinOblique.woff2",
      weight: "200",
      style: "italic",
    },
    {
      path: "./fonts/MDNichrome-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-LightOblique.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/MDNichrome-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-RegularOblique.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/MDNichrome-Dark.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-DarkOblique.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/MDNichrome-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-BoldOblique.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/MDNichrome-Black.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-BlackOblique.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "./fonts/MDNichrome-Ultra.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/MDNichrome-UltraOblique.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-nichrome",
  display: "swap",
  preload: false,
});

const visby = localFont({
  src: [
    {
      path: "./fonts/Visby-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/Visby-ThinOblique.woff2",
      weight: "100",
      style: "italic",
    },
    {
      path: "./fonts/Visby-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Visby-LightOblique.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/Visby-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Visby-RegularOblique.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/Visby-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Visby-MediumOblique.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/Visby-DemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Visby-DemiBoldOblique.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/Visby-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Visby-BoldOblique.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/Visby-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/Visby-ExtraBoldOblique.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "./fonts/Visby-Heavy.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/Visby-HeavyOblique.woff2",
      weight: "900",
      style: "italic",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('sanga_palette')?.value;
  const paletteKey = themeCookie || settings.color_palette || 'default';
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
      <body className="min-h-full flex flex-col bg-linen text-warm-black selection:bg-pink/30 selection:text-plum">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ThemeProvider initialPaletteKey={paletteKey}>
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
