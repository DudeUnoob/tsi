import { existsSync } from 'node:fs';

if (!process.env.VERCEL && existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

const environment = process.env.VERCEL_ENV || 'local';
const isProduction = environment === 'production';
const isPreview = environment === 'preview';
const errors = [];
const warnings = [];

const productionKeys = [
  'APP_URL',
  'PAYMENTS_MODE',
  'STRIPE_ACCOUNT_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CHECKOUT_TOKEN_SECRET',
  'CRON_SECRET',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_ADMIN_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

if (isProduction) {
  for (const key of productionKeys) {
    if (!process.env[key]?.trim()) errors.push(`${key} is required in Production.`);
  }
}

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim() || '';
const stripeMode = /^([sr]k)_live_/.test(stripeKey)
  ? 'live'
  : /^([sr]k)_test_/.test(stripeKey)
    ? 'test'
    : stripeKey
      ? 'invalid'
      : 'disabled';
const paymentsMode = process.env.PAYMENTS_MODE?.trim() || '';
const expectedStripeAccountId = process.env.STRIPE_ACCOUNT_ID?.trim() || '';

if (
  isProduction
  && paymentsMode !== 'test'
  && paymentsMode !== 'live'
) {
  errors.push('PAYMENTS_MODE must be explicitly set to test or live in Production.');
}
if (
  isProduction
  && (paymentsMode === 'test' || paymentsMode === 'live')
  && stripeMode !== paymentsMode
) {
  errors.push(`STRIPE_SECRET_KEY must match PAYMENTS_MODE=${paymentsMode}.`);
}
if (isPreview && stripeMode !== 'disabled' && stripeMode !== 'test') {
  errors.push('STRIPE_SECRET_KEY must be test-mode or absent in Preview.');
}
if (
  process.env.STRIPE_WEBHOOK_SECRET
  && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')
) {
  errors.push('STRIPE_WEBHOOK_SECRET has an invalid format.');
}

for (const key of ['CHECKOUT_TOKEN_SECRET', 'CRON_SECRET']) {
  const value = process.env[key] || '';
  if (value && value.length < 32) {
    errors.push(`${key} must contain at least 32 characters.`);
  }
}

let stripeAccountVerified = false;
if (
  isProduction
  && (stripeMode === 'test' || stripeMode === 'live')
  && expectedStripeAccountId
) {
  try {
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${stripeKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      errors.push(`Stripe rejected STRIPE_SECRET_KEY with HTTP ${response.status}.`);
    } else {
      const account = await response.json();
      if (account.id !== expectedStripeAccountId) {
        errors.push('STRIPE_SECRET_KEY belongs to a different Stripe account.');
      } else {
        stripeAccountVerified = true;
      }
    }
  } catch {
    errors.push('Stripe account verification could not be completed.');
  }
}

const appUrl = process.env.APP_URL?.trim();
if (appUrl) {
  try {
    const parsed = new URL(appUrl);
    const localHttp = parsed.protocol === 'http:'
      && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (
      (parsed.protocol !== 'https:' && !localHttp)
      || parsed.origin !== appUrl
      || parsed.username
      || parsed.password
    ) {
      errors.push('APP_URL must be an HTTPS origin (HTTP is local-only).');
    }
  } catch {
    errors.push('APP_URL must be a valid absolute origin.');
  }
}
const vercelProductionHostname = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
if (isProduction && appUrl && vercelProductionHostname) {
  const expectedAppUrl = `https://${vercelProductionHostname}`;
  if (appUrl !== expectedAppUrl) {
    errors.push(`Production APP_URL must match ${expectedAppUrl}.`);
  }
}

const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
if (serviceAccountValue) {
  try {
    const serviceAccount = JSON.parse(serviceAccountValue);
    if (
      !serviceAccount.project_id
      || !serviceAccount.client_email
      || !serviceAccount.private_key
      || serviceAccount.project_id !== process.env.FIREBASE_ADMIN_PROJECT_ID
    ) {
      errors.push(
        'Firebase Admin credentials are incomplete or do not match FIREBASE_ADMIN_PROJECT_ID.',
      );
    }
  } catch {
    errors.push('FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.');
  }
}

const previewCheckoutConfigured = Boolean(
  isPreview
  && stripeMode === 'test'
  && serviceAccountValue
  && process.env.FIREBASE_ADMIN_PROJECT_ID,
);
if (isPreview && !previewCheckoutConfigured) {
  warnings.push('Preview checkout is disabled until test Stripe and Firebase Admin credentials exist.');
}

if (errors.length) {
  console.error(`Environment validation failed for ${environment}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    environment,
    paymentsMode: paymentsMode || null,
    stripeMode,
    stripeAccountVerified,
    firebaseAdminConfigured: Boolean(
      serviceAccountValue && process.env.FIREBASE_ADMIN_PROJECT_ID,
    ),
    previewCheckoutConfigured,
    warnings,
  }));
}
