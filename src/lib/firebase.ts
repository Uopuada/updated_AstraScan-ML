import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmQhxPnz4Uqkz85wN93oYaSyjtyEHDqTg",
  authDomain: "satellite-imagery-analys-18228.firebaseapp.com",
  projectId: "satellite-imagery-analys-18228",
  storageBucket: "satellite-imagery-analys-18228.firebasestorage.app",
  messagingSenderId: "667117304448",
  appId: "1:667117304448:web:1c2fba968fbe8854a10465",
  measurementId: "G-8D7VS0T10T"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
};

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      // User closed the popup, silently ignore
      return;
    }
    
    console.error("Login failed", error);
    if (error?.code === 'auth/network-request-failed') {
       alert("Network error during login. Please disable ad-blockers, tracking protection (like Brave Shields), or allow third-party cookies for this site, as they may block Firebase Authentication.");
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};
