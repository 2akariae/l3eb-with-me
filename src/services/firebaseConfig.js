// ─── THE MAFIA PLATFORM — services/firebaseConfig.js (v9) ────────────────────
// FIX (COOP): Replaced signInWithPopup with signInWithRedirect to avoid the
//   Cross-Origin-Opener-Policy violation thrown when Firebase tries to close
//   the popup window cross-origin. signInWithRedirect is COOP-safe because it
//   navigates the same tab rather than spawning a new window handle.
//   getRedirectResult() is called on app boot in AuthScreen to complete the flow.
// FIX: All Firebase SDK functions re-exported so consumers don't need to
//   import from 'firebase/*' directly — single import surface.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
  off,
} from 'firebase/database';

// ── Firebase project config ───────────────────────────────────────────────────
// Values are loaded from Vite env variables at build time.
// In development create a .env.local file with these keys.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth          = getAuth(app);
export const db            = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Re-export frequently used Firebase functions so app code imports from one place
export {
  GoogleAuthProvider,
  signInWithPopup,
  ref, set, get, push, update, remove,
  onValue, onDisconnect, serverTimestamp, off,
  signInWithRedirect, getRedirectResult,
  signInAnonymously, updateProfile,
  onAuthStateChanged, signOut,
};
