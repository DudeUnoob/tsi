import 'server-only';

import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID
    || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId });
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
      projectId: serviceAccount.project_id,
    });
  }

  if (process.env.VERCEL) {
    throw new Error(
      'Firebase Admin is not configured for this deployment. Add FIREBASE_SERVICE_ACCOUNT_JSON in Vercel.',
    );
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
