import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Default template configuration (Public Repository / Fallback)
// In production, GitHub Actions replaces or injects credentials via FIREBASE_CONFIG secret before building Docker.
// In development, credentials are read from firebase.local.js (which is ignored by Git).
const defaultFirebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  databaseURL: 'https://your-project-default-rtdb.firebaseio.com',
  projectId: 'your-project',
  storageBucket: 'your-project.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID',
}

// Dynamically load local overrides if available, otherwise fall back to default
let activeConfig = defaultFirebaseConfig
try {
  const localModule = await import('./firebase.local.js')
  if (localModule && localModule.localFirebaseConfig) {
    activeConfig = localModule.localFirebaseConfig
  }
} catch {
  // firebase.local.js is absent in CI or production before build injection
}

const app = getApps().length ? getApp() : initializeApp(activeConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
