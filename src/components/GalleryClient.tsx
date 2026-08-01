'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Camera,
  ChevronDown,
  Film,
  MapPin,
} from 'lucide-react';
import {
  galleryGroupFromHash,
  type AlbumCovers,
  type RetreatAlbum,
  type RetreatSeries,
} from '@/lib/gallery-albums';

interface GalleryClientProps {
  series: RetreatSeries[];
  covers: AlbumCovers;
}

const HERO_PHOTOS = {
  wide: {
    src: '/KED09169.jpg',
    alt: 'A full retreat group standing on the beach at sunset with their arms raised',
  },
  hall: {
    src: '/DSCF0839.JPG',
    alt: 'Retreat participants sitting together on the floor during a morning class',
  },
  shore: {
    src: '/KED09179.jpg',
    alt: 'A small group talking on a blanket on the beach at dusk',
  },
};

const revealContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const revealItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function AlbumMeta({ album }: { album: RetreatAlbum }) {
  const MediaIcon = album.media === 'videos' ? Film : Camera;

  return (
    <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-warm-black/60">
      <p className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-pink" aria-hidden="true" />
        {album.dates}
      </p>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1.5">
          <MediaIcon className="h-3.5 w-3.5 shrink-0 text-pink" aria-hidden="true" />
          {album.media === 'videos' ? 'Videos' : 'Photos'}
        </span>
        {album.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-pink" aria-hidden="true" />
            {album.location}
          </span>
        )}
      </p>
    </div>
  );
}

function AlbumCover({
  album,
  cover,
  sizes,
}: {
  album: RetreatAlbum;
  cover?: string;
  sizes: string;
}) {
  const selectedCover = album.coverImage ?? cover;
  if (!selectedCover) {
    // Google Photos covers can go missing, so the year carries the tile instead.
    return (
      <div className="flex h-full w-full items-center justify-center bg-plum/10">
        <span className="font-display text-5xl font-black text-plum/30 select-none">
          {album.year}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={selectedCover}
      alt={`A photo from ${album.title}`}
      fill
      sizes={sizes}
      className="object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}

function OpenAlbumCue() {
  return (
    <span className="inline-flex items-center text-xs font-black uppercase tracking-widest text-plum transition-colors group-hover:text-pink">
      Open album
      <ArrowUpRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
    </span>
  );
}

const cardShell =
  'group flex flex-col overflow-hidden rounded-3xl border border-plum/10 bg-white/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2 focus-visible:ring-offset-linen';

function AlbumCard({ album, cover }: { album: RetreatAlbum; cover?: string }) {
  if (!album.url) {
    return (
      <div className="flex h-full min-h-64 flex-col justify-center gap-4 rounded-3xl border-2 border-dashed border-plum/25 bg-plum/5 p-8">
        <h3 className="font-display text-2xl font-black text-plum/70">{album.title}</h3>
        <AlbumMeta album={album} />
        <p className="max-w-xs text-sm leading-relaxed text-warm-black/70">{album.pendingNote}</p>
      </div>
    );
  }

  return (
    <a href={album.url} target="_blank" rel="noopener noreferrer" className={`${cardShell} h-full`}>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-plum/10">
        <AlbumCover album={album} cover={cover} sizes="(min-width: 768px) 45vw, 90vw" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-7">
        <div className="space-y-1">
          <h3 className="font-display text-2xl font-black leading-tight text-plum transition-colors group-hover:text-pink">
            {album.title}
          </h3>
          {album.subtitle && (
            <p className="font-display text-base font-bold text-warm-black/70">{album.subtitle}</p>
          )}
        </div>
        <AlbumMeta album={album} />
        <div className="mt-auto pt-2">
          <OpenAlbumCue />
        </div>
      </div>
    </a>
  );
}

/** Used when a series has a single album, so a half-width tile would leave a hole. */
function WideAlbumCard({ album, cover }: { album: RetreatAlbum; cover?: string }) {
  if (!album.url) return <AlbumCard album={album} cover={cover} />;

  return (
    <a
      href={album.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cardShell} md:grid md:grid-cols-5 md:items-stretch`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-plum/10 md:col-span-3 md:aspect-auto md:min-h-[320px]">
        <AlbumCover album={album} cover={cover} sizes="(min-width: 768px) 55vw, 90vw" />
      </div>
      <div className="flex flex-col justify-center gap-5 p-7 sm:p-10 md:col-span-2">
        <div className="space-y-1">
          <h3 className="font-display text-3xl font-black leading-tight text-plum transition-colors group-hover:text-pink">
            {album.title}
          </h3>
          {album.subtitle && (
            <p className="font-display text-base font-bold text-warm-black/70">{album.subtitle}</p>
          )}
        </div>
        <AlbumMeta album={album} />
        <OpenAlbumCue />
      </div>
    </a>
  );
}

export default function GalleryClient({ series, covers }: GalleryClientProps) {
  const reduceMotion = useReducedMotion();
  const defaultGroupId = galleryGroupFromHash(series, '');
  const [openGroupId, setOpenGroupId] = useState<string | undefined>(defaultGroupId);
  const groupButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingGroupScrollRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const syncFromHash = () => {
      setOpenGroupId(galleryGroupFromHash(series, window.location.hash));
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [series]);

  const scrollGroupIntoView = useCallback((groupId: string, behavior: ScrollBehavior) => {
    const button = groupButtonRefs.current[groupId];
    if (!button) return;

    const stickyHeaderHeight =
      document.querySelector<HTMLElement>('header')?.getBoundingClientRect().height ?? 0;
    const top =
      window.scrollY + button.getBoundingClientRect().top - stickyHeaderHeight - 24;

    window.scrollTo({ top: Math.max(0, top), behavior });
    button.focus({ preventScroll: true });
  }, []);

  const openGroup = useCallback(
    (groupId: string, moveFocus: boolean) => {
      if (moveFocus) {
        pendingGroupScrollRef.current = groupId;
      }
      setOpenGroupId(groupId);
      window.history.replaceState(null, '', `#${encodeURIComponent(groupId)}`);

      if (!moveFocus || !reduceMotion) return;
      pendingGroupScrollRef.current = undefined;
      window.requestAnimationFrame(() => {
        scrollGroupIntoView(groupId, 'auto');
      });
    },
    [reduceMotion, scrollGroupIntoView],
  );

  const toggleGroup = useCallback(
    (groupId: string) => {
      if (openGroupId === groupId) {
        setOpenGroupId(undefined);
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        return;
      }
      openGroup(groupId, true);
    },
    [openGroup, openGroupId],
  );

  // Reduced motion drops the variants entirely rather than animating to a
  // static target, so cards can never be left stranded at opacity 0.
  const revealProps = reduceMotion
    ? {}
    : {
        variants: revealContainer,
        initial: 'hidden' as const,
        whileInView: 'show' as const,
        viewport: { once: true, amount: 0.15 },
      };

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-linen text-warm-black">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-14 pb-28 sm:pt-20 sm:pb-32">
        <div className="brand-swirls brand-swirls--soft brand-swirls--photo" aria-hidden="true">
          <span className="brand-swirl brand-swirl--plum" />
          <span className="brand-swirl brand-swirl--fuchsia" />
          <span className="brand-swirl brand-swirl--sunshine" />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-28 bg-gradient-to-b from-transparent via-linen/75 to-linen"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-12">
          <div className="space-y-7 md:col-span-6">
            <span className="inline-block rounded-full border border-plum/10 bg-plum/5 px-4 py-1.5 font-sans text-xs font-black uppercase tracking-wider text-pink">
              Photo Archive
            </span>
            <h1 className="font-display text-4xl font-black leading-tight text-plum sm:text-6xl">
              Every retreat, in photos
            </h1>
            <p className="max-w-xl text-base leading-relaxed font-light text-warm-black/80 sm:text-lg">
              Albums from every Sanga retreat since 2022. Each one opens in Google Photos.
            </p>
            <nav aria-label="Jump to a retreat" className="flex flex-wrap gap-3 pt-1">
              {series.map(group => (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => openGroup(group.id, true)}
                  aria-controls={`${group.id}-panel`}
                  aria-expanded={openGroupId === group.id}
                  className="rounded-full border border-plum/20 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-plum transition-colors hover:bg-plum hover:text-linen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
                >
                  {group.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-6">
            <div className="relative col-span-2 aspect-[16/7] overflow-hidden rounded-3xl border-[6px] border-sunshine shadow-xl">
              <Image
                src={HERO_PHOTOS.wide.src}
                alt={HERO_PHOTOS.wide.alt}
                fill
                priority
                sizes="(min-width: 768px) 45vw, 92vw"
                className="object-cover object-[center_45%]"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg ring-1 ring-plum/10">
              <Image
                src={HERO_PHOTOS.hall.src}
                alt={HERO_PHOTOS.hall.alt}
                fill
                sizes="(min-width: 768px) 22vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-warm-black shadow-lg ring-1 ring-plum/10">
              <Image
                src={HERO_PHOTOS.shore.src}
                alt={HERO_PHOTOS.shore.alt}
                fill
                sizes="(min-width: 768px) 22vw, 45vw"
                className="object-cover brightness-110"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Album index */}
      <div className="relative z-20 mx-auto -mt-16 max-w-7xl space-y-4 px-6 pb-24 sm:-mt-20">
        {series.map(group => {
          const isOpen = openGroupId === group.id;
          const panelId = `${group.id}-panel`;

          return (
            <section
              key={group.id}
              id={group.id}
              className={`scroll-mt-28 overflow-hidden rounded-3xl border bg-white/45 shadow-sm transition-[border-color,background-color,box-shadow] duration-300 ${
                isOpen
                  ? 'border-plum/25 bg-white/65 shadow-md'
                  : 'border-plum/15 hover:border-plum/25 hover:bg-white/60'
              }`}
            >
              <h2>
                <button
                  ref={node => {
                    groupButtonRefs.current[group.id] = node;
                  }}
                  id={`${group.id}-heading`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.id)}
                  className="group flex w-full scroll-mt-28 items-center justify-between gap-6 px-5 py-5 text-left transition-colors hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plum sm:px-7 sm:py-6"
                >
                  <span>
                    <span className="block font-display text-2xl font-black text-plum sm:text-3xl">
                      {group.name}
                    </span>
                    <span className="mt-1 block max-w-2xl text-sm font-light leading-relaxed text-warm-black/70 sm:text-base">
                      {group.blurb}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-6 w-6 shrink-0 text-plum transition-transform ${
                      reduceMotion ? 'duration-0' : 'duration-300'
                    } ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h2>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={`${group.id}-heading`}
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            height: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.24, ease: 'easeOut' },
                          }
                    }
                    onAnimationComplete={() => {
                      if (pendingGroupScrollRef.current !== group.id) return;
                      pendingGroupScrollRef.current = undefined;
                      scrollGroupIntoView(group.id, 'smooth');
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pt-1 pb-8 sm:px-7 sm:pt-2 sm:pb-10">
                      <motion.div
                        {...revealProps}
                        className={`grid gap-6 sm:gap-8 ${
                          group.albums.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                        }`}
                      >
                        {group.albums.map(album => (
                          <motion.div key={album.id} variants={reduceMotion ? undefined : revealItem}>
                            {group.albums.length === 1 ? (
                              <WideAlbumCard album={album} cover={covers[album.id]} />
                            ) : (
                              <AlbumCard album={album} cover={covers[album.id]} />
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>

      {/* Closing invitation */}
      <section className="relative overflow-hidden bg-plum px-6 py-20 text-linen sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-warm-black/20" />
        <div className="relative z-10 mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="font-display text-3xl font-black sm:text-5xl">
            Have photos we are missing?
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed font-light text-linen/80 sm:text-base">
            If you have photos or video from a Sanga retreat, send them over and we will add them to
            the archive.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-full bg-linen px-8 py-4 text-sm font-black uppercase tracking-widest text-plum shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Send us photos
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
