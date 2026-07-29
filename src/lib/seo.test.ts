import { afterEach, describe, expect, it } from 'vitest';
import {
  CANONICAL_SITE_URL,
  getDeploymentUrl,
} from '@/lib/seo';

const originalVercelUrl = process.env.VERCEL_URL;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = originalVercelUrl;

  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
});

describe('SEO deployment URLs', () => {
  it('uses the current Vercel deployment for crawlable metadata assets', () => {
    process.env.VERCEL_URL = 'sanga-fork-example.vercel.app';
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.sangainitiative.org';

    expect(getDeploymentUrl()).toBe('https://sanga-fork-example.vercel.app');
  });

  it('falls back to the canonical site when no deployment URL is configured', () => {
    delete process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    expect(getDeploymentUrl()).toBe(CANONICAL_SITE_URL);
  });
});
