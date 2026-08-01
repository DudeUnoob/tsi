import 'server-only';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function parseOrigin(value: string, label: string, addHttps = false) {
  const candidate = addHttps && !value.includes('://') ? `https://${value}` : value;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${label} must be a valid absolute URL.`);
  }

  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${label} must contain only an origin.`);
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))) {
    throw new Error(`${label} must use HTTPS (HTTP is allowed only for local development).`);
  }
  return url.origin;
}

function allowedPreviewHosts() {
  return new Set(
    (process.env.CHECKOUT_ALLOWED_PREVIEW_HOSTS || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => {
        try {
          return new URL(value.includes('://') ? value : `https://${value}`).host;
        } catch {
          return '';
        }
      })
      .filter(Boolean),
  );
}

/**
 * Resolve customer-facing Stripe callback URLs from stable, server-only
 * configuration. VERCEL_URL is intentionally ignored because it is an
 * immutable deployment URL and may be protected or disappear from the user's
 * navigation context.
 */
export function getCheckoutOrigin(request: Request) {
  if (process.env.APP_URL) {
    return parseOrigin(process.env.APP_URL, 'APP_URL');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return parseOrigin(
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      'VERCEL_PROJECT_PRODUCTION_URL',
      true,
    );
  }

  const requestUrl = new URL(request.url);
  if (LOCAL_HOSTS.has(requestUrl.hostname)) {
    return parseOrigin(requestUrl.origin, 'Local request origin');
  }
  if (
    requestUrl.protocol === 'https:'
    && allowedPreviewHosts().has(requestUrl.host)
  ) {
    return requestUrl.origin;
  }

  throw new Error(
    'APP_URL or VERCEL_PROJECT_PRODUCTION_URL is required for Checkout.',
  );
}
