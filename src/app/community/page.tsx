import Link from 'next/link';
import { ArrowRight, Heart, LockKeyhole, Sparkles, Users } from 'lucide-react';
import { getEventBySlug, getSiteSettings } from '@/lib/firebase';
import { resolveCommunityDestination } from '@/lib/community-links';

export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const source = firstValue(query.source);
  const eventSlug = firstValue(query.event) || firstValue(query.slug);
  const [settings, event] = await Promise.all([
    getSiteSettings(),
    source === 'event' && eventSlug ? getEventBySlug(eventSlug) : Promise.resolve(undefined),
  ]);
  const destination = resolveCommunityDestination({ source, event, settings });
  const contextTitle = source === 'heartspace'
    ? 'Heartspace'
    : event?.title || 'the Sanga community';

  return (
    <div className="min-h-screen bg-linen px-6 py-20 text-warm-black">
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[3rem] bg-plum px-7 py-14 text-center text-linen shadow-xl sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-sunshine/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-pink/20 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-3xl space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-sunshine/40 bg-sunshine/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-sunshine">
              <Sparkles className="h-4 w-4" /> Sanga Community
            </span>
            <h1 className="font-display text-5xl font-black leading-tight text-white sm:text-7xl">
              Come for the experience. <span className="text-sunshine">Stay for the people.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-linen/85">
              Continue to Mighty Networks to sign in, meet the community, and access {contextTitle}.
            </p>
            {destination.external ? (
              <a
                href={destination.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-sunshine px-8 py-4 text-sm font-black uppercase tracking-wider text-plum shadow-lg transition-transform hover:-translate-y-0.5"
              >
                {destination.label} <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            ) : (
              <Link
                href={destination.href}
                className="inline-flex items-center justify-center rounded-full bg-sunshine px-8 py-4 text-sm font-black uppercase tracking-wider text-plum shadow-lg transition-transform hover:-translate-y-0.5"
              >
                {destination.label} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            )}
            {destination.usesFallback && (
              <p className="text-sm text-linen/70">
                The community link is being prepared. Contact us and we&apos;ll help you get connected.
              </p>
            )}
          </div>
        </section>

        <div className="grid gap-6 py-12 md:grid-cols-3">
          {[
            {
              icon: LockKeyhole,
              title: 'One community sign-in',
              text: 'Membership and access are managed securely through Mighty Networks.',
            },
            {
              icon: Users,
              title: 'Your people, year-round',
              text: 'Keep friendships and conversations going between events and courses.',
            },
            {
              icon: Heart,
              title: 'A place to belong',
              text: 'Find event spaces, learning groups, updates, and shared inspiration.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-[2rem] border border-plum/10 bg-white/45 p-7">
              <Icon className="mb-5 h-7 w-7 text-pink" />
              <h2 className="font-display text-xl font-black text-plum">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-warm-black/70">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
