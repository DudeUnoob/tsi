import { afterEach, describe, expect, it } from 'vitest';
import {
  CANONICAL_SITE_URL,
  getDeploymentUrl,
} from '@/lib/seo';

const originalVercelUrl = process.env.VERCEL_URL;
const originalProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const originalPublicProductionUrl =
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = originalVercelUrl;

  if (originalProductionUrl === undefined) {
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  } else {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = originalProductionUrl;
  }

  if (originalPublicProductionUrl === undefined) {
    delete process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  } else {
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL =
      originalPublicProductionUrl;
  }

  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
});

describe('SEO deployment URLs', () => {
  it('uses the public Vercel production URL for crawlable metadata assets', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'sanga-fork-example.vercel.app';
    process.env.VERCEL_URL = 'sanga-protected-deployment.vercel.app';
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.sangainitiative.org';

    expect(getDeploymentUrl()).toBe('https://sanga-fork-example.vercel.app');
  });

  it('falls back to the canonical site when no deployment URL is configured', () => {
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    expect(getDeploymentUrl()).toBe(CANONICAL_SITE_URL);
  });
});
