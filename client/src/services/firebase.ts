import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from '../../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey !== "REDACTED" ? config.apiKey : import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: config.authDomain !== "REDACTED" ? config.authDomain : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.projectId !== "REDACTED" ? config.projectId : import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.storageBucket !== "REDACTED" ? config.storageBucket : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.messagingSenderId !== "REDACTED" ? config.messagingSenderId : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.appId !== "REDACTED" ? config.appId : import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const auth = getAuth(app);

export default app;
