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
}

export interface RetreatSeries {
  id: string;
  name: string;
  blurb: string;
  albums: RetreatAlbum[];
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

/** Every album that currently has a live share link. */
export function linkedAlbums(series: RetreatSeries[] = retreatSeries): RetreatAlbum[] {
  return series.flatMap(group => group.albums.filter(album => Boolean(album.url)));
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
  const results = await Promise.all(linkedAlbums(series).map(fetchAlbumCover));
  return Object.fromEntries(
    results.filter((entry): entry is [string, string] => Boolean(entry)),
  );
}
