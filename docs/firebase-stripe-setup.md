# Firebase and Stripe environment

## Active backend

The application uses the Firebase project `tsiwebsite` for Firestore, Firebase
Authentication, and Cloud Storage. The Supabase migrations in this repository are
historical and are not imported by the application.

Firebase web configuration belongs in `.env.local` using the
`NEXT_PUBLIC_FIREBASE_*` variables shown in `.env.example`. These values identify
the Firebase project; they are not service-account credentials. Protect data with
Firebase Auth, Firestore rules, Storage rules, and App Check.

## Stripe sandbox/test mode

The checkout uses Stripe-hosted Checkout Sessions. Card data never enters this
application.

1. In the intended Stripe account, switch to or create a sandbox.
2. Create a restricted test key with only the permissions required by Checkout.
3. Set `STRIPE_SECRET_KEY` locally and in the deployment environment. Never prefix
   it with `NEXT_PUBLIC_` and never store it in Firestore.
   Set `PAYMENTS_MODE=test` and `STRIPE_ACCOUNT_ID` to the expected account so
   deployment validates both the key mode and account ownership.
4. Create a webhook event destination for
   `https://YOUR_DOMAIN/api/stripe/webhook`.
5. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
6. Set the destination signing secret as `STRIPE_WEBHOOK_SECRET`.
   At live launch, replace both Stripe secrets, set `PAYMENTS_MODE=live`, and
   redeploy. No application-code change is required.
7. Leave Checkout payment methods dynamic. In Stripe payment-method settings,
   enable only immediate methods you intend to support, such as cards, wallets,
   and Link.
8. Do not enable Stripe Tax for the merchandise Checkout flow until tax
   registrations are confirmed.
9. Set the server-only `APP_URL` to that Vercel project's stable public
   deployment origin (for example, `https://tsi-henna.vercel.app`).
10. Set a separate random `CHECKOUT_TOKEN_SECRET`. It signs the opaque
    Resume/Cancel capability stored in the customer's browser and must remain
    server-only.

For local webhook testing:

```bash
# Terminal 1: runs Next.js against the real configured Firebase project.
npm run dev

# Terminal 2: forwards only the commerce events handled by the application.
npm run stripe:listen
```

Copy the `whsec_...` value printed by `stripe:listen` into
`STRIPE_WEBHOOK_SECRET` in `.env.local`. If it changed, restart `dev` so
Next.js loads the new value.

Open `http://localhost:3000/store`, add a real Firebase catalog item, and check
out with:

- Card number: `4242 4242 4242 4242`
- Any future expiration date
- Any three-digit CVC
- Any valid United States test shipping address

Before Checkout, `available` temporarily falls and `reserved` rises while
physical `on_hand` remains unchanged. Stripe Checkout opens in a separate tab,
leaving the original cart available. Editing or removing an item first expires
the open Stripe Session and waits for Firebase to confirm the reservation was
released; if payment already won that race, the edit is rejected. Returning
through Stripe's cancel action expires the Session and releases immediately;
closing the tab releases when Stripe expires the Session after 30 minutes. After the paid webhook,
`on_hand` and `reserved` each fall by the purchased quantity while `sold` rises.
Inspect the resulting production Firestore `orders` and `product_inventory`
documents in Firebase Console. Although Stripe is in test mode, these Firebase
records and inventory changes are real and are not reset when the app restarts.

## Firebase Admin and Firestore

The public Firebase web configuration cannot perform commerce mutations. Server
routes use Firebase Admin:

1. Create a service account for the `tsiwebsite` Firebase project.
2. For localhost, download its JSON key outside this repository and set
   `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local` to the file's absolute path.
   For Vercel, store the complete JSON document as the single-line
   `FIREBASE_SERVICE_ACCOUNT_JSON` secret.
3. Set `FIREBASE_ADMIN_PROJECT_ID=tsiwebsite`.
4. Deploy the protected rules and required index:

```bash
firebase use tsiwebsite
firebase deploy --only firestore:rules,firestore:indexes
```

The rules permit public reads of published products and inventory availability.
Orders, Stripe events, customer information, audits, and all commerce mutations
are server-only. Merch admin APIs verify Firebase ID tokens and accept the
`admin: true` custom claim or the approved Sanga administrator email list.

## Catalog migration

Back up Firestore before changing live data. The migration preserves old fields
for rollback and never applies inventory deductions for historical orders.

```bash
# Prints the planned updates without writing.
npm run commerce:migrate

# Writes a timestamped local backup, then applies updates in safe batches.
npm run commerce:migrate:apply
```

It converts display prices such as `$45` to integer cents, creates explicit
variant metadata, initializes reservations, and marks old orders as legacy
imports. The local `backups/` directory is ignored by Git.

## Reconciliation and rollout

Set a strong `CRON_SECRET`. `vercel.json` schedules
`/api/cron/reconcile-inventory` once daily; Stripe webhooks remain the primary
reservation-release mechanism. Administrators can also select **Reconcile with
Stripe** in Store Orders. Reconciliation retrieves each Session and never
releases inventory when Stripe is unavailable or reports payment as paid or
processing.

`npm test` runs both mandatory unit/route tests and isolated Firestore
transaction tests. The production runtime still uses the configured real
Firebase project; the emulator is used only to keep destructive concurrency
tests away from real merchandise records.

Deploy to Preview first, use only sandbox credentials, perform the dry-run
migration and acceptance tests, then create equivalent live restricted
credentials and a separate live webhook destination.
