import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Heart,
  Sparkles,
} from 'lucide-react';
import { getCachedResources as getResources } from '@/lib/cached-data';
import BrandRibbon from '@/components/BrandRibbon';

export const revalidate = 300; // Cached; admin saves bust the tag via /api/revalidate
export const metadata: Metadata = {
  title: 'Education',
  description: 'Study, reflect, and grow through Sanga learning experiences and thoughtful bhakti resources.',
  alternates: { canonical: 'https://www.sangainitiative.org/education' },
};

export default async function EducationPage() {
  const resources = (await getResources()).sort(
    (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
  );

  return (
    <div className="min-h-screen bg-linen pb-24 text-warm-black">
      <section className="relative overflow-hidden bg-plum px-6 py-20 text-linen">
        <BrandRibbon />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-sunshine/40 bg-sunshine/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-sunshine">
            <BookOpen className="h-4 w-4" /> Learn Together
          </span>
          <h1 className="mt-6 font-display text-5xl font-black leading-tight text-white sm:text-7xl">
            Wisdom grows <span className="text-sunshine">in good company.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-linen/85">
            Explore thoughtful spaces for study, reflection, and the conversations that help bhakti meet everyday life.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-20 px-6 pt-16">
        <section aria-labelledby="programs-heading">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-pink">Learning experiences</p>
            <h2 id="programs-heading" className="mt-3 font-display text-4xl font-black text-plum">
              Find a space to go deeper
            </h2>
          </div>

          <div className="grid gap-7 lg:grid-cols-3">
            <article className="relative overflow-hidden rounded-[2.5rem] bg-plum p-8 text-linen shadow-lg">
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-pink/25" />
              <div className="relative z-10 flex h-full flex-col">
                <Heart className="h-8 w-8 text-sunshine" />
                <p className="mt-8 text-xs font-black uppercase tracking-widest text-sunshine">Now forming</p>
                <h3 className="mt-2 font-display text-3xl font-black text-white">Heartspace</h3>
                <p className="mt-2 font-bold text-pink">with Vraja Bihari Prabhu</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-linen/80">
                  A welcoming online space to study, ask honest questions, and bring spiritual wisdom into daily life.
                </p>
                <Link
                  href="/education/heartspace"
                  className="mt-8 inline-flex items-center text-sm font-black uppercase tracking-wider text-sunshine"
                >
                  Explore Heartspace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </article>

            {[
              {
                title: 'Immersive Experience',
                text: 'A guided learning experience designed to bring timeless teachings into lived practice.',
              },
              {
                title: 'Exploratory',
                text: 'A welcoming starting point for curiosity, conversation, and discovering bhakti together.',
              },
            ].map((program) => (
              <article
                key={program.title}
                className="flex min-h-80 flex-col rounded-[2.5rem] border border-plum/10 bg-white/45 p-8 shadow-sm"
              >
                <Clock3 className="h-8 w-8 text-pink" />
                <span className="mt-8 w-fit rounded-full bg-sunshine/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-plum">
                  Coming Soon
                </span>
                <h3 className="mt-4 font-display text-3xl font-black text-plum">{program.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-warm-black/70">{program.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="resources-heading">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-pink">From the Sanga library</p>
              <h2 id="resources-heading" className="mt-3 font-display text-4xl font-black text-plum">
                Resources to use and share
              </h2>
            </div>
            <Sparkles className="hidden h-9 w-9 text-sunshine sm:block" />
          </div>

          {resources.length > 0 ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => {
                const href = resource.uploaded_file_url || resource.external_url;
                const isDownload = Boolean(resource.uploaded_file_url);
                return (
                  <article
                    key={resource.id}
                    className="flex min-h-72 flex-col rounded-[2rem] border border-plum/10 bg-white/45 p-7"
                  >
                    <FileText className="h-7 w-7 text-pink" />
                    <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-plum/55">
                      {resource.category || 'Resource'}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-black text-plum">{resource.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-warm-black/70">{resource.description}</p>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-7 inline-flex items-center text-xs font-black uppercase tracking-wider text-plum hover:text-pink"
                      >
                        {isDownload ? 'Download resource' : 'Open resource'}
                        {isDownload
                          ? <Download className="ml-2 h-4 w-4" />
                          : <ExternalLink className="ml-2 h-4 w-4" />}
                      </a>
                    ) : (
                      <span className="mt-7 text-xs font-black uppercase tracking-wider text-plum/45">
                        Available soon
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-plum/20 bg-plum/5 px-6 py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-plum/35" />
              <p className="mt-4 font-display text-xl font-black text-plum">Resources are being gathered.</p>
              <p className="mt-2 text-sm text-warm-black/60">Check back soon for tools you can use with your community.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
