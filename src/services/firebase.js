import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

let app
let db
let auth
let googleProvider

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
  googleProvider.addScope('email')
  googleProvider.addScope('profile')

  // Persist auth state across sessions
  setPersistence(auth, browserLocalPersistence)

  // Optional: connect to emulator in development
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATOR === 'true') {
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectAuthEmulator(auth, 'http://localhost:9099')
  }
} catch (e) {
  console.warn('Firebase init failed:', e.message)
}

export { app, db, auth, googleProvider }