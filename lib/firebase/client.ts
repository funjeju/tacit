import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Guard: skip Firebase init during SSR/build when env vars are absent
function getFirebaseApp() {
  if (!firebaseConfig.apiKey) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const _app = getFirebaseApp();

// '(default)' 명시 필수 — 연결 버그 방지
// These are undefined when apiKey is missing (build time / SSR without config).
// All callers are 'use client' components and only run in the browser where apiKey is present.
export const db = _app ? getFirestore(_app, '(default)') : (undefined as unknown as ReturnType<typeof getFirestore>);
export const auth = _app ? getAuth(_app) : (undefined as unknown as ReturnType<typeof getAuth>);
export const storage = _app ? getStorage(_app) : (undefined as unknown as ReturnType<typeof getStorage>);

export default _app;
