// Server-side Firebase Admin SDK configuration
// This file is for server-side operations only (API routes, server components, etc.)

import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;
let isInitialized = false;

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  // Check if we have individual service account credentials
  const hasIndividualCredentials = 
    process.env.BE_FIREBASE_PROJECT_ID &&
    process.env.BE_FIREBASE_PRIVATE_KEY &&
    process.env.BE_FIREBASE_CLIENT_EMAIL;

  // Try to get service account from JSON string or individual env vars
  let serviceAccount;
  if (process.env.BE_FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.BE_FIREBASE_SERVICE_ACCOUNT_KEY);
  } else if (hasIndividualCredentials) {
    serviceAccount = {
      projectId: process.env.BE_FIREBASE_PROJECT_ID,
      privateKey: process.env.BE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.BE_FIREBASE_CLIENT_EMAIL,
    };
  }

  app = initializeApp(
    serviceAccount
      ? {
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.BE_FIREBASE_PROJECT_ID,
        }
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
  );
  isInitialized = true;
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);

// Get Firestore instance
const db = getFirestore(app);

// Initialize Firestore settings only on first initialization
if (isInitialized) {
  db.settings({
    ignoreUndefinedProperties: true,
  });
}

export const adminDb = db;
export const adminStorage = getStorage(app);
