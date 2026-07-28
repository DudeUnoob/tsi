import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteSettings } from "@/lib/firebase";
import { cookies } from "next/headers";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";

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
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('sanga_palette')?.value;
  const paletteKey = themeCookie || settings.color_palette || 'default';

  return (
    <html
      lang="en"
      className={`${nichrome.variable} ${visby.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-linen text-warm-black selection:bg-pink/30 selection:text-plum">
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
