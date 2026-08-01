import type { Metadata } from 'next';
import { ArrowRight, BookHeart, MessageCircleHeart, Sparkles, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Heartspace',
  description: 'Explore Heartspace with Vraja Bihari Prabhu, a Sanga learning space for reflection and meaningful bhakti conversation.',
  alternates: {
    canonical: 'https://www.sangainitiative.org/education/heartspace',
  },
};

export default function HeartspacePage() {
  return (
    <div className="min-h-screen bg-linen px-6 py-16 text-warm-black">
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[3rem] bg-plum px-7 py-14 text-linen shadow-xl sm:px-14 sm:py-20">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-pink/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-sunshine/20 blur-3xl" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sunshine/40 bg-sunshine/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-sunshine">
              <Sparkles className="h-4 w-4" /> Online Learning
            </span>
            <h1 className="mt-6 font-display text-5xl font-black leading-tight text-white sm:text-7xl">Heartspace</h1>
            <p className="mt-3 text-xl font-bold text-pink">with Vraja Bihari Prabhu</p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-linen/85">
              A low-pressure place to study meaningful texts, ask real questions, and share what is moving in your spiritual life.
            </p>
            <a
              href="https://sanga.mn.co/share/VDBRE4q6Njl0Aftf?utm_source=manual"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-9 inline-flex items-center rounded-full bg-sunshine px-8 py-4 text-sm font-black uppercase tracking-wider text-plum shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Join Heartspace <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </section>

        <section className="grid gap-6 py-12 md:grid-cols-3">
          {[
            {
              icon: BookHeart,
              title: 'Study with heart',
              text: 'Explore teachings with room for reflection, nuance, and lived experience.',
            },
            {
              icon: MessageCircleHeart,
              title: 'Ask honest questions',
              text: 'Bring what you are actually thinking about—no performance required.',
            },
            {
              icon: Users,
              title: 'Grow in community',
              text: 'Learn alongside people navigating devotion, relationships, work, and life.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-[2rem] border border-plum/10 bg-white/45 p-7">
              <Icon className="h-7 w-7 text-pink" />
              <h2 className="mt-5 font-display text-xl font-black text-plum">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-warm-black/70">{text}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
