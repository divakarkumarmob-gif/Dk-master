import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate config
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined' && firebaseConfig.apiKey !== '';

if (!isConfigValid) {
  console.error("[FIREBASE] Configuration is missing or invalid. Check GitHub Secrets.");
  // Add a visible indicator for the APK user
  if (typeof window !== 'undefined') {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:black;color:yellow;padding:20px;z-index:9999999;font-family:monospace;font-size:10px;';
    errorMsg.innerHTML = `<strong>FIREBASE CONFIG MISSING</strong><br/>Steps:<br/>1. Go to Repo Settings > Secrets<br/>2. Add VITE_FIREBASE_API_KEY, etc.<br/>3. Re-run GitHub Action`;
    document.body.appendChild(errorMsg);
  }
}

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

const app = initializeApp(isConfigValid ? firebaseConfig : {
    apiKey: "missing",
    authDomain: "missing",
    projectId: "missing",
    appId: "missing"
});

// Use persistentLocalCache for offline capabilities across multiple tabs
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
}, databaseId && databaseId !== 'undefined' ? databaseId : undefined);

export const storage = getStorage(app);

export const auth = getAuth(app);

async function testConnection() {
  if (!navigator.onLine) return;
  try {
    // Only try to fetch if we haven't successfully connected before
    // We use getDocFromServer to force a network check
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[FIREBASE] Connected successfully");
  } catch (error: any) {
    // Suppress common transient errors in the console
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        console.warn("[FIREBASE] Connection delayed or temporarily unavailable. Retrying in background...");
    } else {
        console.error("[FIREBASE] Connection Error:", error.message);
    }
  }
}
testConnection();
