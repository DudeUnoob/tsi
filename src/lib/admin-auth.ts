import 'server-only';

import { getAdminAuth } from '@/lib/firebase-admin';

const ALLOWED_ADMIN_EMAILS = new Set([
  'info@sangainitiative.org',
  'sangainitiative@gmail.com',
  'avanish@sangainitiative.org',
  'avanish600@gmail.com',
]);

export async function requireAdmin(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }

  const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7), true);
  const email = decoded.email?.toLowerCase().trim();
  const allowed =
    decoded.admin === true
    || Boolean(email && (ALLOWED_ADMIN_EMAILS.has(email) || email.endsWith('@sangainitiative.org')));

  if (!allowed) {
    throw new Error('FORBIDDEN');
  }

  return {
    uid: decoded.uid,
    email: email || '',
  };
}
