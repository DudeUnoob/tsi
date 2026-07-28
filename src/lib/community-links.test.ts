import { describe, expect, it } from 'vitest';
import { resolveCommunityDestination } from './community-links';
import type { Event, SiteSettings } from './types';

const settings = {
  mighty_networks_url: 'https://community.example.com',
  heartspace_url: 'https://community.example.com/heartspace',
} satisfies Pick<SiteSettings, 'mighty_networks_url' | 'heartspace_url'>;

const event = {
  community_registration_url: 'https://community.example.com/events/summit',
} as Event;

describe('resolveCommunityDestination', () => {
  it('prefers an event-specific community page', () => {
    expect(resolveCommunityDestination({ source: 'event', event, settings }).href)
      .toBe(event.community_registration_url);
  });

  it('prefers Heartspace and then falls back to the global community', () => {
    expect(resolveCommunityDestination({ source: 'heartspace', settings }).href)
      .toBe(settings.heartspace_url);

    expect(resolveCommunityDestination({
      source: 'heartspace',
      settings: { ...settings, heartspace_url: ' ' },
    }).href).toBe(settings.mighty_networks_url);
  });

  it('uses Contact rather than a dead link when nothing is configured', () => {
    expect(resolveCommunityDestination({
      source: 'event',
      settings: { mighty_networks_url: '', heartspace_url: '' },
    })).toEqual({
      href: '/contact',
      label: 'Contact Sanga',
      external: false,
      usesFallback: true,
    });
  });

  it('rejects malformed or non-web community destinations', () => {
    expect(resolveCommunityDestination({
      settings: { mighty_networks_url: 'javascript:alert(1)', heartspace_url: '' },
    }).href).toBe('/contact');
  });
});
