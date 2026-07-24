# Sanga Website Platform - A Vaishnava Youth Collective

Welcome to the production-quality, custom-built web platform for **Sanga** (a Vaishnava Youth Collective). This platform is a fully custom Next.js (App Router) application replacing the legacy Squarespace site. It brings rich HSL aesthetics, dynamic color palettes, a robust retreats system, a merchandise catalog, and an advanced volunteer administration dashboard.

---

## Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first engine)
- **Database, Auth & Storage**: [Firebase](https://firebase.google.com/) (Firestore, Firebase Auth, and Cloud Storage)
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

### 2. Merchandise Store

The store is reserved for physical Sanga merchandise. Firebase owns catalog,
variant inventory, reservations, and orders; Stripe-hosted Checkout owns payment
collection. Every order ships within the United States for a flat $5 fee. Events,
registrations, cabin upgrades, and donations use their own separate flows.

### 3. Dynamic Color Themes & Swatches
Admins can change the site's palette on the fly from the staff portal. We defined four premium themes:
1. **Linen & Plum (Default Rebrand)**: `#FFEFBF` background, `#6E0B64` primary accents, `#FF7DB4` secondary accents.
2. **Ocean Breeze**: Alice Blue `#E0F2FE` background, slate `#0F172A` text, `#0369A1` primary accents.
3. **Forest Sage**: Soft Sage `#E8F5E9` background, `#1B5E20` text, `#2E7D32` primary accents.
4. **Midnight Glow (Dark Theme)**: Dark `#121214` background, `#F4F4F6` text, fuchsia `#BF3078` primary highlights.

*How it works*: `src/app/layout.tsx` fetches active configurations and injects CSS custom variables (`--background`, `--color-plum`, etc.) directly into the document header on the server side, resulting in instant theme rendering without unstyled content flash.

### 4. Stripe-hosted Checkout

Merchandise Checkout is server-created from trusted Firebase prices and inventory.
The browser submits only product, variant, quantity, and a checkout-attempt ID.
Stripe opens in a separate tab. If a customer edits the original cart while its
Session is still open, the app expires that Session and confirms inventory was
released before applying the edit. Secrets are never stored in Firebase or
exposed in the admin panel.

---

## Local Development

### 1. Install Packages
Use Node.js 22 (the version pinned in `.nvmrc`). In the root directory, install
npm packages:
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live site. 
*(If Firebase environment variables are missing, the project falls back to local mock data.)*

---

## Database and Payments Configuration

The active backend is the Firebase project `tsiwebsite`. The `supabase/` directory is retained as historical migration material and is not on the runtime path.

1. Copy `.env.example` to `.env.local`.
2. Add the Firebase web configuration and Stripe sandbox/test credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tsiwebsite
   STRIPE_SECRET_KEY=rk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   CHECKOUT_TOKEN_SECRET=a-long-random-server-only-value
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
3. Follow [docs/firebase-stripe-setup.md](docs/firebase-stripe-setup.md) to deploy
   Firestore rules, migrate catalog data, and configure admin credentials.
4. Point the Stripe event destination at `/api/stripe/webhook` and subscribe to
   every event listed in the setup guide.
5. Run `npm test`; the command includes the mandatory Firestore transaction
   suite and fails if reservation/race-condition tests do not run.

---

## Production Deployment on Vercel

1. Push this code repository to your GitHub account.
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** -> **Project**.
3. Import your Sanga repository.
4. Add every variable listed in `.env.example`, using sandbox/test Stripe credentials until end-to-end verification is complete.
5. Click **Deploy**. Vercel will bundle the optimized site and publish it.

### Routing your custom domain
In your Vercel project panel:
1. Go to **Settings** -> **Domains**.
2. Add `www.sangainitiative.org` and `sangainitiative.org`.
3. In your domain registrar settings (e.g. GoDaddy, Namecheap), set:
   - CNAME `www` pointing to `cname.vercel-dns.com`
   - A `@` pointing to `76.76.21.21` (Vercel Global IP)
