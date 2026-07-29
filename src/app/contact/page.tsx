import type { Metadata } from 'next';
import { ExternalLink, Heart, Mail, Sparkles, Users } from 'lucide-react';
import { getCachedSiteSettings as getSiteSettings } from '@/lib/cached-data';
import BrandRibbon from '@/components/BrandRibbon';

export const revalidate = 300; // Cached; admin saves bust the tag via /api/revalidate
export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Sanga, join the community, and connect through email and social channels.',
  alternates: { canonical: 'https://www.sangainitiative.org/contact' },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const email = settings.contact_email.trim();
  const mightyNetworksUrl = settings.mighty_networks_url.trim();
  const instagramUrl = settings.instagram_url.trim();
  const facebookUrl = settings.facebook_url.trim();
  const links = [
    email && {
      title: 'Email',
      description: 'Questions about events, education, support, or anything else? Write to us.',
      href: `mailto:${email}`,
      label: email,
      icon: Mail,
      external: false,
    },
    mightyNetworksUrl && {
      title: 'Mighty Networks',
      description: 'Sign in to the Sanga community and keep the connection going year-round.',
      href: mightyNetworksUrl,
      label: 'Open the community',
      icon: Users,
      external: true,
    },
    instagramUrl && {
      title: 'Instagram',
      description: 'Follow along for announcements, photographs, and moments from Sanga.',
      href: instagramUrl,
      label: 'Follow on Instagram',
      icon: Heart,
      external: true,
    },
    facebookUrl && {
      title: 'Facebook',
      description: 'Find updates and share Sanga with friends in your wider community.',
      href: facebookUrl,
      label: 'Visit Facebook',
      icon: Heart,
      external: true,
    },
  ].filter(Boolean) as Array<{
    title: string;
    description: string;
    href: string;
    label: string;
    icon: typeof Mail;
    external: boolean;
  }>;

  return (
    <div className="min-h-screen bg-linen pb-24 text-warm-black">
      <section className="relative overflow-hidden bg-plum px-6 py-20 text-center text-linen">
        <BrandRibbon />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-sunshine/40 bg-sunshine/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-sunshine">
            <Sparkles className="h-4 w-4" /> Connect
          </span>
          <h1 className="mt-6 font-display text-5xl font-black leading-tight text-white sm:text-7xl">
            There&apos;s always <span className="text-sunshine">room in the circle.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-linen/85">
            Reach out with a question, find us online, or step into the community. We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 pt-14">
        {links.length > 0 ? (
          <div className="grid gap-7 md:grid-cols-2">
            {links.map(({ title, description, href, label, icon: Icon, external }) => (
              <article key={title} className="flex min-h-64 flex-col rounded-[2.25rem] border border-plum/10 bg-white/45 p-8 shadow-sm">
                <Icon className="h-8 w-8 text-pink" />
                <h2 className="mt-6 font-display text-2xl font-black text-plum">{title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-warm-black/70">{description}</p>
                <a
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="mt-7 inline-flex items-center self-start break-all text-sm font-black text-plum hover:text-pink"
                >
                  {label}
                  {external && <ExternalLink className="ml-2 h-4 w-4 shrink-0" />}
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-[2rem] border border-dashed border-plum/20 bg-plum/5 px-8 py-14 text-center">
            <Mail className="mx-auto h-10 w-10 text-plum/35" />
            <h2 className="mt-4 font-display text-2xl font-black text-plum">Contact details are being updated.</h2>
            <p className="mt-2 text-sm text-warm-black/60">Please check back soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
