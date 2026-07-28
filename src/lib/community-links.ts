import type { Event, SiteSettings } from './types';

export interface CommunityDestination {
  href: string;
  label: string;
  external: boolean;
  usesFallback: boolean;
}

function configuredUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export function resolveCommunityDestination({
  source,
  event,
  settings,
}: {
  source?: string;
  event?: Event;
  settings: Pick<SiteSettings, 'mighty_networks_url' | 'heartspace_url'>;
}): CommunityDestination {
  const isHeartspace = source === 'heartspace';
  const eventUrl = source === 'event'
    ? configuredUrl(event?.community_registration_url)
    : undefined;
  const heartspaceUrl = isHeartspace
    ? configuredUrl(settings.heartspace_url)
    : undefined;
  const globalUrl = configuredUrl(settings.mighty_networks_url);
  const href = eventUrl || heartspaceUrl || globalUrl;

  if (!href) {
    return {
      href: '/contact',
      label: 'Contact Sanga',
      external: false,
      usesFallback: true,
    };
  }

  return {
    href,
    label: isHeartspace ? 'Enter Heartspace' : 'Continue to Mighty Networks',
    external: true,
    usesFallback: false,
  };
}
