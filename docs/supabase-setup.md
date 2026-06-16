# Supabase Setup Guide - Sanga Website

This guide walks you through setting up a Supabase project to back the new Sanga website, configuring authentication, setting up databases, and enabling file uploads.

---

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in or create a free account.
2. In the dashboard, click **New Project** and select your organization.
3. Enter the project details:
   - **Name**: `Sanga Web`
   - **Database Password**: *Generate a secure password and save it safely.*
   - **Region**: Select a region close to your primary audience (e.g., East US).
   - **Pricing Plan**: Select the **Free Tier**.
4. Click **Create new project** and wait for the database provisioning to complete (usually 1-2 minutes).

---

## 2. Obtain credentials and set up environment variables

1. Once the project is ready, navigate to the **Project Settings** (gear icon) -> **API**.
2. Locate the following keys in the **Project API keys** section:
   - **Project URL**: Under *API URL* (looks like `https://xyz.supabase.co`).
   - **Anon Key**: Under *Project API keys* marked `anon public`.
3. In your local Sanga project folder, create a file named `.env.local` (or copy the `.env.example` file):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Save the file. When running the website locally using `npm run dev`, it will now automatically connect to your live database instead of using the local mock fallback.

---

## 3. Run Database Migrations

To create all Sanga tables (Events, Store Products, Forms Submissions, and RLS policies), you must execute our SQL schema:

1. In the Supabase Dashboard sidebar, click on the **SQL Editor** (terminal icon).
2. Click **New Query** -> **Blank Query**.
3. Open the file [20260616000000_init_schema.sql](file:///Users/avanish/Desktop/Coding%20stuff/tsi/supabase/migrations/20260616000000_init_schema.sql) in your text editor.
4. Copy the entire contents of the SQL file and paste it into the Supabase SQL Editor text area.
5. Click **Run** at the bottom right.
6. Verify that the query returns a success confirmation message. All Sanga database tables are now ready!

---

## 4. Setup Media Storage Buckets

To allow staff members to upload event cover pictures or resource documents from the admin dashboard, create a public storage bucket:

1. Click on the **Storage** section (bucket icon) in the Supabase sidebar.
2. Click **New Bucket**.
3. Enter the bucket name: `media`.
4. Turn on the **Public** toggle (this is required so that uploaded images can be read by public visitors on the website).
5. Click **Save**.
6. Select the `media` bucket, click **Allowed MIME Types** if you want to restrict uploads, or leave it blank to support standard images and documents.

---

## 5. Create Your First Admin User

To log in to the hidden admin panel (`/admin`):

1. Click on the **Authentication** section (users icon) in the Supabase sidebar.
2. Click **Add User** -> **Create User**.
3. Enter the admin user's credentials:
   - **Email Address**: Enter their email.
   - **Password**: Enter a secure password.
4. Uncheck **Auto-confirm User** if you want them to verify their email, or leave it checked to immediately activate the account (recommended for initial setup).
5. Click **Confirm**.
6. The user is created and will automatically receive an entry in the `public.profiles` database via our trigger. You can now use these credentials to log in at `/admin`.
