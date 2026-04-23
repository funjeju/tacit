import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let _adminApp: ReturnType<typeof initializeApp> | null = null;

function getAdminApp() {
  if (_adminApp) return _adminApp;
  const existing = getApps();
  if (existing.length > 0) {
    _adminApp = existing[0];
    return _adminApp;
  }
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error('FIREBASE_ADMIN_PROJECT_ID is not set');
  }
  _adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  return _adminApp;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

// Proxy-based lazy exports — callers can use `adminDb.collection(...)` directly
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    const db = getAdminDb();
    const val = (db as any)[prop];
    return typeof val === 'function' ? val.bind(db) : val;
  },
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    const auth = getAdminAuth();
    const val = (auth as any)[prop];
    return typeof val === 'function' ? val.bind(auth) : val;
  },
});
