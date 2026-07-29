import { describe, expect, it } from 'vitest';
import { linkedAlbums, parseAlbumCover, retreatSeries, withCoverSize } from './gallery-albums';

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
