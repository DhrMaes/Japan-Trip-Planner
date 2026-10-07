import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAwWFej_q-UtGzZXQAAGV_ofrP93qzPEPA',
  authDomain: 'jpn27-fa06b.firebaseapp.com',
  databaseURL: 'https://jpn27-fa06b-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'jpn27-fa06b',
  storageBucket: 'jpn27-fa06b.firebasestorage.app',
  messagingSenderId: '463308520364',
  appId: '1:463308520364:web:19c514d949207e8ecd1809',
  measurementId: 'G-559YP0EFX9',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
