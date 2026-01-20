import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBOeyPMizlS7vxYoGWO66XMW4B-Fq7-nzY",
  authDomain: "twitter-clone-portfolio-94025.firebaseapp.com",
  projectId: "twitter-clone-portfolio-94025",
  storageBucket: "twitter-clone-portfolio-94025.firebasestorage.app",
  messagingSenderId: "670897502246",
  appId: "1:670897502246:web:e04abcf8d37d5c2291cee7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
