import type { Metadata } from 'next';
import GalleryClient from '@/components/GalleryClient';
import { getAlbumCovers, retreatSeries } from '@/lib/gallery-albums';

// Album covers change rarely, and a stale cover still links to the right album.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photo and video albums from every Sanga retreat since 2022, including Summit, East Coast, West Coast, and Midwest.',
  alternates: { canonical: 'https://www.sangainitiative.org/gallery' },
};

export default async function GalleryPage() {
  const covers = await getAlbumCovers(retreatSeries);

  return <GalleryClient series={retreatSeries} covers={covers} />;
}
