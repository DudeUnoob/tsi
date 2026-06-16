# Deployment & DNS Domain Configuration Guide

This guide describes how to deploy the Sanga website revamp to production hosting on Vercel and point your official domain name (`sangainitiative.org`).

---

## 1. Production Build Verification

Before deploying your code, verify that it builds without linting or compilation errors:

```bash
# Verify TypeScript compiles
npx tsc --noEmit

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## 2. Deploy to Vercel

Vercel is the recommended hosting platform for Next.js applications, offering automatic scaling and global CDN optimization.

### Step 1: Connect your Git repository
1. Push this codebase to a git repository (GitHub, GitLab, or Bitbucket).
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** -> **Project**.
3. Link your Git account if not already connected, and select this repository.

### Step 2: Configure variables
1. In the **Configure Project** step, expand the **Environment Variables** section.
2. Enter your production Supabase keys:
   - `NEXT_PUBLIC_SUPABASE_URL` = *Your live Supabase API URL*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *Your live Supabase Anon Key*
3. *Note: If these variables are not entered, the public pages will default to serving local mock fallback data.*

### Step 3: Deploy
1. Click **Deploy**.
2. Vercel will run `npm run build` and launch a preview URL for your site (e.g., `https://sanga-web.vercel.app`).

---

## 3. Configure Custom Domain

To link your primary domain (`sangainitiative.org` and `www.sangainitiative.org`) to Vercel:

1. In your Vercel Project panel, go to **Settings** -> **Domains**.
2. Type `sangainitiative.org` and click **Add**.
3. Select the option to **Redirect www.sangainitiative.org to sangainitiative.org** (recommended) or keep them separate.
4. Vercel will show DNS records you need to register at your domain registrar.

### Step 4: Register DNS records
Log in to your domain registrar (GoDaddy, Namecheap, Google Domains) and add:

- **Record 1: Primary domain redirect**
  - Type: `A`
  - Name: `@` (or leave blank)
  - Value: `76.76.21.21` (Vercel IP)
  
- **Record 2: Subdomain routing**
  - Type: `CNAME`
  - Name: `www`
  - Value: `cname.vercel-dns.com`

*Remove any existing A records or CNAME records mapping to Squarespace hosting.*

### Step 5: Wait for propagation
DNS records take between 10 minutes to a few hours to propagate globally. Once ready, Vercel will automatically provision a secure Let's Encrypt SSL certificate, and your new site will be live!
