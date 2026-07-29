export const SITE_NAME = 'Sanga';
export const SITE_TITLE = 'Sanga | A Vaishnava Youth Collective';
export const SITE_DESCRIPTION =
  'Sanga is a Vaishnava youth collective creating spaces for friendship, growth, and shared experience in Krishna consciousness.';
export const CANONICAL_SITE_URL = 'https://www.sangainitiative.org';

export function getDeploymentUrl() {
  const deploymentHost = process.env.VERCEL_URL;
  if (deploymentHost) return `https://${deploymentHost}`;

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return new URL(configuredUrl).origin;

  return CANONICAL_SITE_URL;
}

export const primaryPages = [
  '/',
  '/events',
  '/education',
  '/education/heartspace',
  '/calendar',
  '/store',
  '/support',
  '/contact',
  '/community',
] as const;
