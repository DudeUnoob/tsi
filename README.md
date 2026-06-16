# Sanga Website Platform - A Vaishnava Youth Collective

Welcome to the production-quality, custom-built web platform for **Sanga** (a Vaishnava Youth Collective). This platform is a fully custom Next.js (App Router) application replacing the legacy Squarespace site. It brings rich HSL aesthetics, dynamic color palettes, a robust retreats system, a merchandise catalog, and an advanced volunteer administration dashboard.

---

## Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first engine)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security RLS)
- **Motion & Interactions**: Framer Motion
- **Form Handling**: React Hook Form + Zod validation
- **Deployment**: Vercel-ready with zero additional configuration

---

## Core Features & Migration Mappings

### 1. Seeded Retreats & Experiences (Sync from Sanga Website)
We have fully audited Sanga's upcoming and historical events on the live squarespace catalog and pre-populated the fallback seeds (and schema structure):
- **TSI Summit (Ages 18–35)**: Core national gathering at Palace Lodge, PA. Details highlights, night kirtans, and organic farm meals. Links directly to Sanga's checkout form.
- **Midwest Retreat (Ages 18–35)**: Regional gathering in Sand Dunes, MI for beach harinamas and outdoor study.
- **East Coast Retreat (Ages 18–35)**: Historic long weekend at Gita Nagari Eco-Farm, PA (marked as *Past* event).
- **Camp Ignite (Ages 11–17)**: Premier youth summer camp in Shenandoah Meadows, VA. Features full packing guide checklists, counselor listings, and highlights.
- **Sanga Reconnect Retreat (Ages 21–40)**: Intended for alumni and young devotee families. Contains sub-purchasing upgrades for premium cabins.
- **Brazil Mission Trip (Ages 18–35)**: Pilgrimage and service trip to Nova Gokula, Brazil (marked as *Coming Soon*).
- **Vrindavana Yatra (Ages 21–30)**: Chanting and parikrama trip to Vrindavana, India (marked as *Coming Soon*).
- **Heartspace Talk (Ages 18–35)**: Digital monthly check-in and Q&A (marked as *Online*).

### 2. E-Commerce & Cabins Upgrades
Seeded the e-commerce tab with Sanga's cabin packages:
- **Premium Cabin Upgrade (Couple)**: Double queens with private attached bathroom at Gita Nagari.
- **Premium Cabin Upgrade (Family)**: Shared cabins with bunk beds, heater, and en-suite facilities.

### 3. Dynamic Color Themes & Swatches
Admins can change the site's palette on the fly from the staff portal. We defined four premium themes:
1. **Linen & Plum (Default Rebrand)**: `#FFEFBF` background, `#6E0B64` primary accents, `#FF7DB4` secondary accents.
2. **Ocean Breeze**: Alice Blue `#E0F2FE` background, slate `#0F172A` text, `#0369A1` primary accents.
3. **Forest Sage**: Soft Sage `#E8F5E9` background, `#1B5E20` text, `#2E7D32` primary accents.
4. **Midnight Glow (Dark Theme)**: Dark `#121214` background, `#F4F4F6` text, fuchsia `#BF3078` primary highlights.

*How it works*: `src/app/layout.tsx` fetches active configurations and injects CSS custom variables (`--background`, `--color-plum`, etc.) directly into the document header on the server side, resulting in instant theme rendering without unstyled content flash.

### 4. Direct Stripe Checkout Integration
Sanga can transition from external checkouts to native overlays in the **Settings** panel:
- **Direct Mode**: Toggle "Direct Stripe Checkout Mode" to swap Squarespace links with direct Stripe sessions.
- **API Setup**: Input your `Stripe Publishable Key` and `Stripe Secret Key` directly into the panel. Local fallback files are pre-wired to read these inputs.

---

## Local Development

### 1. Install Packages
In the root directory, install npm packages:
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live site. 
*(If Supabase environment variables are missing, the project will automatically fall back to loading the seeded retreats and store catalog from memory, while the `/admin` portal shows setup configurations.)*

---

## Database Configuration (Supabase Setup)

To configure the live database for newsletter subscriber data collections, contact form submissions, and database edits:

1. **Create Supabase Account & Project**: Sign up on [Supabase](https://supabase.com).
2. **Run Migrations Schema**: Copy the SQL schema file from `supabase/migrations/20260616000000_init_schema.sql` and run it in the SQL Editor of your Supabase panel.
3. **Configure Storage**: In the Storage tab of Supabase, create a new public bucket named `media` so coordinators can upload custom photos.
4. **Link Credentials**: Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. **Add Admin Account**: Go to Authentication -> Users in Supabase, and invite or create your first staff member. Use these credentials to sign in at `/admin`.

---

## Production Deployment on Vercel

1. Push this code repository to your GitHub account.
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** -> **Project**.
3. Import your Sanga repository.
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will bundle the optimized site and publish it.

### Routing your custom domain
In your Vercel project panel:
1. Go to **Settings** -> **Domains**.
2. Add `www.sangainitiative.org` and `sangainitiative.org`.
3. In your domain registrar settings (e.g. GoDaddy, Namecheap), set:
   - CNAME `www` pointing to `cname.vercel-dns.com`
   - A `@` pointing to `76.76.21.21` (Vercel Global IP)
