import Link from 'next/link';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';

export default function CalendarPage() {
  return (
    <main className="min-h-[72vh] bg-linen text-warm-black font-sans flex items-center">
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="relative overflow-hidden rounded-[3rem] border border-plum/10 bg-plum px-8 py-16 sm:px-16 sm:py-20 text-linen shadow-xl">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-pink/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-12 h-72 w-72 rounded-full bg-sunshine/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-linen/10 border border-linen/20 text-sunshine text-xs font-black uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" />
              Sanga Calendar
            </span>
            <CalendarDays className="h-16 w-16 text-sunshine my-8" />
            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              More moments together are coming
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-linen/80 leading-relaxed font-light">
              Our shared calendar is being prepared. In the meantime, explore currently
              announced retreats, talks, camps, and online events.
            </p>
            <Link
              href="/events"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-sunshine px-7 py-3.5 text-xs font-black uppercase tracking-widest text-plum transition-transform hover:-translate-y-0.5"
            >
              Explore Events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
