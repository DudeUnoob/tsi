import { describe, expect, it } from 'vitest';
import {
  galleryGroupFromHash,
  getAlbumCovers,
  linkedAlbums,
  normalizeGallerySeries,
  parseAlbumCover,
  publicGallerySeries,
  retreatSeries,
  withCoverSize,
} from './gallery-albums';

describe('retreat album data', () => {
  it('keeps album ids unique so cover lookups cannot collide', () => {
    const ids = retreatSeries.flatMap(series => series.albums.map(album => album.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists albums newest first within each series', () => {
    for (const series of retreatSeries) {
      const years = series.albums.map(album => album.year);
      expect(years).toEqual([...years].sort((a, b) => b - a));
    }
  });

  it('places a pending Summit 2023 card between 2024 and 2022', () => {
    const summit = retreatSeries.find(series => series.id === 'summit');
    expect(summit?.albums.map(album => album.id)).toEqual([
      'summit-2025-photos',
      'summit-2025-videos',
      'summit-2024',
      'summit-2023',
      'summit-2022',
    ]);
    expect(summit?.albums.find(album => album.id === 'summit-2023')).toMatchObject({
      year: 2023,
      media: 'photos',
      pendingNote: expect.any(String),
    });
  });

  it('points every published album at a Google Photos share link', () => {
    for (const album of linkedAlbums()) {
      expect(new URL(album.url!).hostname).toBe('photos.app.goo.gl');
    }
  });

  it('explains itself when an album has no link yet', () => {
    const pending = retreatSeries
      .flatMap(series => series.albums)
      .filter(album => !album.url);

    expect(pending.length).toBeGreaterThan(0);
    for (const album of pending) {
      expect(album.pendingNote?.trim()).toBeTruthy();
    }
  });
});

describe('gallery settings normalization', () => {
  const configured = [
    {
      id: 'summit',
      name: 'Summit',
      blurb: 'Together every summer.',
      published: true,
      albums: [
        {
          id: 'summit-2027',
          title: 'Summit 2027',
          dates: 'Summer 2027',
          year: 2027,
          media: 'photos',
          pendingNote: 'Album coming soon.',
          coverImage: 'https://firebasestorage.googleapis.com/v0/b/example/o/cover.jpg',
        },
      ],
    },
  ];

  it('normalizes valid editor data without replacing its order', () => {
    expect(normalizeGallerySeries(configured)).toEqual(configured);
  });

  it('falls back atomically for duplicate ids or malformed URLs', () => {
    const duplicateAlbum = [
      configured[0],
      { ...configured[0], id: 'east-coast', name: 'East Coast' },
    ];
    expect(normalizeGallerySeries(duplicateAlbum)).toBe(retreatSeries);

    const unsafeUrl = structuredClone(configured);
    unsafeUrl[0].albums[0].coverImage = 'javascript:alert(1)';
    expect(normalizeGallerySeries(unsafeUrl)).toBe(retreatSeries);

    const wrongAlbumHost = structuredClone(configured);
    Object.assign(wrongAlbumHost[0].albums[0], {
      url: 'https://example.com/photos',
    });
    expect(normalizeGallerySeries(wrongAlbumHost)).toBe(retreatSeries);
  });

  it('filters unpublished albums and empty or unpublished groups from the public page', () => {
    const visible = publicGallerySeries([
      {
        id: 'summit',
        name: 'Summit',
        blurb: '',
        albums: [
          { ...retreatSeries[0].albums[0], published: true },
          { ...retreatSeries[0].albums[1], published: false },
        ],
      },
      {
        id: 'empty',
        name: 'Empty',
        blurb: '',
        albums: [{ ...retreatSeries[0].albums[0], id: 'draft', published: false }],
      },
      {
        id: 'draft-group',
        name: 'Draft group',
        blurb: '',
        published: false,
        albums: [{ ...retreatSeries[0].albums[0], id: 'hidden' }],
      },
    ]);

    expect(visible).toHaveLength(1);
    expect(visible[0].albums.map(album => album.id)).toEqual(['summit-2025-photos']);
  });

  it('uses manual cover overrides without fetching a scraped cover', async () => {
    const series = normalizeGallerySeries(configured);
    await expect(getAlbumCovers(series)).resolves.toEqual({
      'summit-2027': configured[0].albums[0].coverImage,
    });
  });

  it('selects valid hashes and falls back to Summit', () => {
    expect(galleryGroupFromHash(retreatSeries, '#east-coast')).toBe('east-coast');
    expect(galleryGroupFromHash(retreatSeries, '#missing')).toBe('summit');
    expect(galleryGroupFromHash(retreatSeries, '#%E0%A4%A')).toBe('summit');
  });
});

describe('parseAlbumCover', () => {
  it('reads the Open Graph cover from a share page', () => {
    const html = `
      <meta property="og:title" content="TSI Midwest Retreat 2025">
      <meta property="og:image" content="https://lh3.googleusercontent.com/pw/abc=w600-h315-p-k">
    `;

    expect(parseAlbumCover(html)).toBe(
      'https://lh3.googleusercontent.com/pw/abc=w600-h315-p-k',
    );
  });

  it('ignores pages without a usable https cover', () => {
    expect(parseAlbumCover('<html><body>no tags here</body></html>')).toBeUndefined();
    expect(
      parseAlbumCover('<meta property="og:image" content="javascript:alert(1)">'),
    ).toBeUndefined();
    expect(parseAlbumCover('<meta property="og:image" content="">')).toBeUndefined();
  });
});

describe('withCoverSize', () => {
  it('asks googleusercontent for a card-sized crop', () => {
    expect(
      withCoverSize('https://lh3.googleusercontent.com/pw/abc=w600-h315-p-k', 1200, 750),
    ).toBe('https://lh3.googleusercontent.com/pw/abc=w1200-h750-p-k');
  });

  it('leaves URLs without a size segment alone', () => {
    const plain = 'https://lh3.googleusercontent.com/pw/abc';
    expect(withCoverSize(plain, 1200, 750)).toBe(plain);
  });
});
