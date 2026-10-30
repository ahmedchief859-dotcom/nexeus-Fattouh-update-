import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.apiKey ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'nexora-business-erp-saas-os.firebaseapp.com',
  projectId: 'nexora-business-erp-saas-os',
  storageBucket: 'nexora-business-erp-saas-os.firebasestorage.app',
  messagingSenderId: '653881662000',
  appId: '1:653881662000:web:c22221f80bfe14a7182bf5',
  measurementId: 'G-9EK6EL0915',
}

const firebaseInitializationIssue = !firebaseConfig.apiKey
  ? 'Firebase API key is not exposed to the browser build.'
  : String(firebaseConfig.apiKey).includes('process.env')
    ? 'Firebase API key was not replaced during the browser build.'
    : null

// Firebase Auth requires every preview hostname to be added under Authentication > Settings > Authorized domains.
// This client cannot change that allowlist; keep the message available for actionable preview diagnostics.
export const firebaseDomainGuidance = typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')
  ? 'Add this Vercel preview hostname to Firebase Authorized domains.'
  : null

const canInitializeFirebase = typeof window !== 'undefined' && !firebaseInitializationIssue

let firebaseAppInstance: ReturnType<typeof initializeApp> | null = null
let firebaseAuthInstance: ReturnType<typeof getAuth> | null = null
let firestoreInstance: ReturnType<typeof getFirestore> | null = null

if (canInitializeFirebase) {
  try {
    firebaseAppInstance = getApps().length ? getApp() : initializeApp(firebaseConfig)
    firebaseAuthInstance = getAuth(firebaseAppInstance)
    firestoreInstance = getFirestore(firebaseAppInstance)
  } catch {
    firebaseAppInstance = null
    firebaseAuthInstance = null
    firestoreInstance = null
  }
}

export const firebaseApp = firebaseAppInstance
export const firebaseAuth = firebaseAuthInstance
export const googleProvider = new GoogleAuthProvider()
export const firestore = firestoreInstance
