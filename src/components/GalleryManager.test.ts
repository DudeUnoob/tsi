import { describe, expect, it } from 'vitest';
import { galleryEditorErrors } from './GalleryManager';
import type { RetreatSeries } from '@/lib/gallery-albums';

const validSeries: RetreatSeries[] = [
  {
    id: 'summit',
    name: 'Summit',
    blurb: 'Annual gathering.',
    albums: [
      {
        id: 'summit-2025',
        title: 'Summit 2025',
        dates: 'Summer 2025',
        year: 2025,
        media: 'photos',
        url: 'https://photos.app.goo.gl/example',
        coverImage: 'https://firebasestorage.googleapis.com/v0/b/example/o/cover.jpg',
      },
    ],
  },
];

describe('galleryEditorErrors', () => {
  it('accepts complete published album data', () => {
    expect(galleryEditorErrors(validSeries)).toEqual([]);
  });

  it('rejects duplicate album IDs', () => {
    const series = structuredClone(validSeries);
    series[0].albums.push({ ...series[0].albums[0] });
    expect(galleryEditorErrors(series)).toContain('Duplicate album ID: summit-2025');
  });

  it('requires safe album and cover URLs', () => {
    const series = structuredClone(validSeries);
    series[0].albums[0].url = 'https://example.com/not-google-photos';
    series[0].albums[0].coverImage = 'http://example.com/cover.jpg';
    expect(galleryEditorErrors(series)).toEqual([
      'Summit 2025 needs an HTTPS Google Photos share URL.',
      'Summit 2025 needs an HTTPS cover image URL.',
    ]);
  });

  it('requires a pending message when an album has no URL', () => {
    const series = structuredClone(validSeries);
    delete series[0].albums[0].url;
    expect(galleryEditorErrors(series)).toContain(
      'Summit 2025 needs an album URL or a pending message.',
    );
  });
});
