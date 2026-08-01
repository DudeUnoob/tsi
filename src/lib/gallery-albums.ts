export type AlbumMedia = 'photos' | 'videos';

export interface RetreatAlbum {
  /** Stable id used for React keys and cover lookups. */
  id: string;
  /** Card heading, e.g. "West Coast 2025". */
  title: string;
  /** Retreat theme or edition name, when the album has one. */
  subtitle?: string;
  location?: string;
  /** Human-readable range copied from the shared album, e.g. "Sep 11 - 15, 2025". */
  dates: string;
  year: number;
  media: AlbumMedia;
  /** Absent while an album is still being tracked down. */
  url?: string;
  /** Shown in place of the link when `url` is absent. */
  pendingNote?: string;
  /** Lets editors stage an album without exposing it publicly. */
  published?: boolean;
  /** Optional editor-selected cover. Takes precedence over the Google Photos cover. */
  coverImage?: string;
}

export interface RetreatSeries {
  id: string;
  name: string;
  blurb: string;
  albums: RetreatAlbum[];
  /** Lets editors stage a whole gallery group without exposing it publicly. */
  published?: boolean;
}

/**
 * Album links are Google Photos share URLs. Titles and date ranges mirror the
 * album names so the page stays readable even when a cover image fails to load.
 */
export const retreatSeries: RetreatSeries[] = [
  {
    id: 'summit',
    name: 'Summit',
    blurb: 'The summer gathering that brings every region together.',
    albums: [
      {
        id: 'summit-2025-photos',
        title: 'Summit 2025',
        location: 'Naperville, Illinois',
        dates: 'Jul 8 - 13, 2025',
        year: 2025,
        media: 'photos',
        url: 'https://photos.app.goo.gl/mGAes9T3wZuK9Cq99',
      },
      {
        id: 'summit-2025-videos',
        title: 'Summit 2025',
        location: 'Naperville, Illinois',
        dates: 'Jul 8 - 12, 2025',
        year: 2025,
        media: 'videos',
        url: 'https://photos.app.goo.gl/TnfPtGpYJpDWTV5U6',
      },
      {
        id: 'summit-2024',
        title: 'Summit 2024',
        dates: 'Summer 2024',
        year: 2024,
        media: 'photos',
        pendingNote: 'We are still tracking this album down. Check back soon.',
      },
      {
        id: 'summit-2023',
        title: 'Summit 2023',
        dates: 'Summer 2023',
        year: 2023,
        media: 'photos',
        pendingNote: 'We are still tracking this album down. Check back soon.',
      },
      {
        id: 'summit-2022',
        title: 'Summit 2022',
        location: 'Gita Nagari',
        dates: 'Jul 28 - Aug 1, 2022',
        year: 2022,
        media: 'photos',
        url: 'https://photos.app.goo.gl/APQZd6PaMCdHvfCw6',
      },
    ],
  },
  {
    id: 'east-coast',
    name: 'East Coast',
    blurb: 'Early summer on the East Coast.',
    albums: [
      {
        id: 'east-coast-2026',
        title: 'East Coast 2026',
        dates: 'Jun 4 - 10, 2026',
        year: 2026,
        media: 'photos',
        url: 'https://photos.app.goo.gl/1weEk837SmJhPLMo8',
      },
      {
        id: 'east-coast-2025',
        title: 'East Coast 2025',
        dates: 'May 29 - Jun 3, 2025',
        year: 2025,
        media: 'photos',
        url: 'https://photos.app.goo.gl/bzmjQ7p2TgmTv4Rk6',
      },
    ],
  },
  {
    id: 'west-coast',
    name: 'West Coast',
    blurb: 'September on the coast, five days at a time.',
    albums: [
      {
        id: 'west-coast-2025',
        title: 'West Coast 2025',
        subtitle: "Krishna's Always There",
        dates: 'Sep 11 - 15, 2025',
        year: 2025,
        media: 'photos',
        url: 'https://photos.app.goo.gl/Y1qJsDVQRBS1PNfZ9',
      },
      {
        id: 'west-coast-2024',
        title: 'West Coast 2024',
        dates: 'Sep 12 - 17, 2024',
        year: 2024,
        media: 'photos',
        url: 'https://photos.app.goo.gl/Gg9c5RV8wAMUgibFA',
      },
    ],
  },
  {
    id: 'midwest',
    name: 'Midwest',
    blurb: 'A spring weekend in the Midwest.',
    albums: [
      {
        id: 'midwest-2025',
        title: 'Midwest 2025',
        dates: 'Apr 4 - 6, 2025',
        year: 2025,
        media: 'photos',
        url: 'https://photos.app.goo.gl/dtZ9anATRPBzYYy29',
      },
    ],
  },
];

export type AlbumCovers = Record<string, string>;

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isGooglePhotosUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'photos.app.goo.gl';
  } catch {
    return false;
  }
}

function parseAlbum(value: unknown): RetreatAlbum | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const album = value as Record<string, unknown>;

  if (
    !nonEmptyString(album.id) ||
    !SAFE_ID.test(album.id) ||
    !nonEmptyString(album.title) ||
    !nonEmptyString(album.dates) ||
    typeof album.year !== 'number' ||
    !Number.isInteger(album.year) ||
    album.year < 2000 ||
    album.year > 2100 ||
    (album.media !== 'photos' && album.media !== 'videos') ||
    !optionalString(album.subtitle) ||
    !optionalString(album.location) ||
    !optionalString(album.pendingNote) ||
    !optionalString(album.url) ||
    !optionalString(album.coverImage) ||
    (album.published !== undefined && typeof album.published !== 'boolean')
  ) {
    return undefined;
  }

  const url = nonEmptyString(album.url) ? album.url.trim() : undefined;
  const coverImage = nonEmptyString(album.coverImage) ? album.coverImage.trim() : undefined;
  const pendingNote = nonEmptyString(album.pendingNote) ? album.pendingNote.trim() : undefined;
  if ((url && !isGooglePhotosUrl(url)) || (coverImage && !isHttpsUrl(coverImage))) {
    return undefined;
  }
  if (!url && !pendingNote) return undefined;

  return {
    id: album.id.trim(),
    title: album.title.trim(),
    subtitle: nonEmptyString(album.subtitle) ? album.subtitle.trim() : undefined,
    location: nonEmptyString(album.location) ? album.location.trim() : undefined,
    dates: album.dates.trim(),
    year: album.year as number,
    media: album.media,
    url,
    pendingNote,
    published: album.published as boolean | undefined,
    coverImage,
  };
}

/**
 * Validates editor-provided gallery settings as one atomic document. Any
 * malformed group, album, URL, or duplicate id falls back to compiled content
 * so a partial admin edit can never take the public gallery down.
 */
export function normalizeGallerySeries(
  value: unknown,
  fallback: RetreatSeries[] = retreatSeries,
): RetreatSeries[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;

  const groupIds = new Set<string>();
  const albumIds = new Set<string>();
  const normalized: RetreatSeries[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return fallback;
    const group = item as Record<string, unknown>;
    if (
      !nonEmptyString(group.id) ||
      !SAFE_ID.test(group.id) ||
      !nonEmptyString(group.name) ||
      typeof group.blurb !== 'string' ||
      !Array.isArray(group.albums) ||
      (group.published !== undefined && typeof group.published !== 'boolean') ||
      groupIds.has(group.id)
    ) {
      return fallback;
    }

    const albums: RetreatAlbum[] = [];
    for (const albumValue of group.albums) {
      const album = parseAlbum(albumValue);
      if (!album || albumIds.has(album.id)) return fallback;
      albumIds.add(album.id);
      albums.push(album);
    }

    groupIds.add(group.id);
    normalized.push({
      id: group.id.trim(),
      name: group.name.trim(),
      blurb: group.blurb.trim(),
      published: group.published as boolean | undefined,
      albums,
    });
  }

  return normalized;
}

/** Removes editor-only drafts and groups that have nothing public to show. */
export function publicGallerySeries(series: RetreatSeries[]): RetreatSeries[] {
  return series.flatMap(group => {
    if (group.published === false) return [];
    const albums = group.albums.filter(album => album.published !== false);
    return albums.length > 0 ? [{ ...group, albums }] : [];
  });
}

/** Resolves a URL hash to a visible gallery group, with Summit as the default. */
export function galleryGroupFromHash(series: RetreatSeries[], hash: string): string | undefined {
  const fallback = series.find(group => group.id === 'summit')?.id ?? series[0]?.id;
  let requested = hash.replace(/^#/, '');
  try {
    requested = decodeURIComponent(requested);
  } catch {
    return fallback;
  }
  return series.some(group => group.id === requested) ? requested : fallback;
}

/** Every published album that currently has a live share link. */
export function linkedAlbums(series: RetreatSeries[] = retreatSeries): RetreatAlbum[] {
  return publicGallerySeries(series).flatMap(group =>
    group.albums.filter(album => Boolean(album.url)),
  );
}

/**
 * Pulls the album cover out of a Google Photos share page. The share page is a
 * JavaScript app, but it still renders Open Graph tags for link unfurling.
 */
export function parseAlbumCover(html: string): string | undefined {
  const match = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  );
  const url = match?.[1];
  if (!url) return undefined;

  try {
    return new URL(url).protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Share pages advertise a 600x315 unfurl thumbnail. googleusercontent encodes the
 * crop in the URL, so ask for a card-sized 16:10 version instead of upscaling a
 * small one. URLs in any other shape are left untouched.
 */
export function withCoverSize(url: string, width: number, height: number): string {
  return url.replace(/=w\d+-h\d+/, `=w${width}-h${height}`);
}

const COVER_WIDTH = 1200;
const COVER_HEIGHT = 750;

/**
 * Google Photos serves Open Graph tags to link unfurlers rather than to a plain
 * browser request, so identify as one.
 */
const UNFURL_USER_AGENT =
  'Mozilla/5.0 (compatible; SangaSiteBot/1.0; +https://www.sangainitiative.org)';

async function fetchAlbumCover(album: RetreatAlbum): Promise<[string, string] | undefined> {
  if (!album.url) return undefined;

  try {
    const response = await fetch(album.url, {
      headers: { 'user-agent': UNFURL_USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return undefined;

    const cover = parseAlbumCover(await response.text());
    return cover ? [album.id, withCoverSize(cover, COVER_WIDTH, COVER_HEIGHT)] : undefined;
  } catch {
    // A missing cover falls back to a brand tile, so a failed lookup is not fatal.
    return undefined;
  }
}

/** Resolves cover images for every linked album, keyed by album id. */
export async function getAlbumCovers(
  series: RetreatSeries[] = retreatSeries,
): Promise<AlbumCovers> {
  const albums = publicGallerySeries(series).flatMap(group => group.albums);
  const manualCovers: [string, string][] = albums
    .filter((album): album is RetreatAlbum & { coverImage: string } => Boolean(album.coverImage))
    .map(album => [album.id, album.coverImage]);
  const results = await Promise.all(
    albums
      .filter(album => album.url && !album.coverImage)
      .map(fetchAlbumCover),
  );
  return Object.fromEntries(
    [
      ...results.filter((entry): entry is [string, string] => Boolean(entry)),
      ...manualCovers,
    ],
  );
}
