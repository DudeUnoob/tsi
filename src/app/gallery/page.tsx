import type { Metadata } from 'next';
import GalleryClient from '@/components/GalleryClient';
import { getCachedSiteSettings } from '@/lib/cached-data';
import {
  getAlbumCovers,
  normalizeGallerySeries,
  publicGallerySeries,
  retreatSeries,
} from '@/lib/gallery-albums';

// Album covers change rarely, and a stale cover still links to the right album.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photo and video albums from every Sanga retreat since 2022, including Summit, East Coast, West Coast, and Midwest.',
  alternates: { canonical: 'https://www.sangainitiative.org/gallery' },
};

export default async function GalleryPage() {
  const settings = await getCachedSiteSettings();
  const configuredSeries = (settings as unknown as Record<string, unknown>).gallery_series;
  const series = publicGallerySeries(normalizeGallerySeries(configuredSeries, retreatSeries));
  const covers = await getAlbumCovers(series);

  return <GalleryClient series={series} covers={covers} />;
}
