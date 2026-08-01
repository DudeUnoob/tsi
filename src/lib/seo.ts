export const SITE_NAME = 'Sanga';
export const SITE_TITLE = 'Sanga | A Vaishnava Youth Collective';
export const SITE_DESCRIPTION =
  'Sanga is a Vaishnava youth collective creating spaces for friendship, growth, and shared experience in Krishna consciousness.';
export const CANONICAL_SITE_URL = 'https://www.sangainitiative.org';

export function getDeploymentUrl() {
  // VERCEL_URL can point at a deployment protected by Vercel Authentication,
  // which prevents social crawlers from fetching metadata images. The project
  // production URL is public and remains stable across Production and Preview.
  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL
    || process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost) return `https://${productionHost}`;

  const configuredUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return new URL(configuredUrl).origin;

  return CANONICAL_SITE_URL;
}

export const primaryPages = [
  '/',
  '/events',
  '/gallery',
  '/education',
  '/education/heartspace',
  '/calendar',
  '/store',
  '/support',
  '/contact',
  '/community',
] as const;
