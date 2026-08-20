import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCMnga6xRIxgl3fGB0_50OYczmy7ER6kLA",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "wey-playground.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "wey-playground",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "wey-playground.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "333755003429",
  appId: env.VITE_FIREBASE_APP_ID || "1:333755003429:web:70ffc80698a14ed50dc5cc"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
