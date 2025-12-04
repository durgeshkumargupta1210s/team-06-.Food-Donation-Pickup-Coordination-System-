import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

let adminApp: App | undefined;

if (!getApps().length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

if (!adminApp && getApps().length) {
  adminApp = getApps()[0];
}

if (!adminApp) {
  throw new Error('Firebase admin SDK is not configured. Set FIREBASE_ADMIN_* env vars.');
}

export const adminDb = getFirestore(adminApp);
export const adminMessaging = getMessaging(adminApp);
