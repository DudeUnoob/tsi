import { afterEach, describe, expect, it } from 'vitest';
import { getCheckoutOrigin } from './checkout-origin';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('getCheckoutOrigin', () => {
  it('prefers the stable server-only APP_URL', () => {
    process.env.APP_URL = 'https://tsi-henna.vercel.app';
    process.env.VERCEL_URL = 'tsi-git-preview.example.vercel.app';
    expect(getCheckoutOrigin(new Request('https://other.example/checkout'))).toBe(
      'https://tsi-henna.vercel.app',
    );
  });

  it('falls back to the stable Vercel project production URL', () => {
    delete process.env.APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'tsi-henna.vercel.app';
    expect(getCheckoutOrigin(new Request('https://preview.example/checkout'))).toBe(
      'https://tsi-henna.vercel.app',
    );
  });

  it('allows localhost without deployed configuration', () => {
    delete process.env.APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(getCheckoutOrigin(new Request('http://localhost:3000/api/checkout'))).toBe(
      'http://localhost:3000',
    );
  });

  it('allows only explicitly configured HTTPS preview origins', () => {
    delete process.env.APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.CHECKOUT_ALLOWED_PREVIEW_HOSTS = 'tsi-preview.vercel.app';
    expect(getCheckoutOrigin(
      new Request('https://tsi-preview.vercel.app/api/checkout'),
    )).toBe('https://tsi-preview.vercel.app');
    expect(() => getCheckoutOrigin(
      new Request('https://unlisted-preview.vercel.app/api/checkout'),
    )).toThrow('APP_URL or VERCEL_PROJECT_PRODUCTION_URL');
  });

  it('rejects insecure public callback configuration', () => {
    process.env.APP_URL = 'http://tsi-henna.vercel.app';
    expect(() => getCheckoutOrigin(
      new Request('https://tsi-henna.vercel.app/api/checkout'),
    )).toThrow('must use HTTPS');
  });
});
