import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/gatherings',
        destination: '/events',
        permanent: true,
      },
      {
        source: '/gatherings/:slug',
        destination: '/events/:slug',
        permanent: true,
      },
      {
        source: '/resources',
        destination: '/education',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
      },
      {
        protocol: 'http',
        hostname: 'static1.squarespace.com',
      },
      {
        protocol: 'https',
        hostname: 'static1.squarespace.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        // Google Photos album covers linked from the gallery.
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.squarespace.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // AVIF first, WebP second: the hero and event photos are large JPEGs from
    // the Squarespace CDN, where AVIF typically lands well under WebP.
    formats: ['image/avif', 'image/webp'],
    // These remote photos are effectively immutable, so hold optimised variants
    // for a year rather than re-optimising on the short default interval.
    minimumCacheTTL: 31536000,
  },
  // Trims the response body on self-hosted/Node deployments. Vercel already
  // compresses at the edge, where this is a no-op.
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
