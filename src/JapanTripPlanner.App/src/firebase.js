import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Fallback configuration if window.FIREBASE_CONFIG is not yet loaded
const fallbackConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  databaseURL: 'https://your-project-default-rtdb.firebaseio.com',
  projectId: 'your-project',
  storageBucket: 'your-project.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID',
}

const firebaseConfig = (typeof window !== 'undefined' && window.FIREBASE_CONFIG)
  ? window.FIREBASE_CONFIG
  : fallbackConfig

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
