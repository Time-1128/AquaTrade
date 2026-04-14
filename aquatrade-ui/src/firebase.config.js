import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // ✅ important
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBiANKFHfV036HAVCRAwy6lbzNSTNfI3II",
  authDomain: "aquatrade-9e20f.firebaseapp.com",
  projectId: "aquatrade-9e20f",
  storageBucket: "aquatrade-9e20f.firebasestorage.app",
  messagingSenderId: "372262100182",
  appId: "1:372262100182:web:2e856c550eecd9b6f63d77",
  measurementId: "G-NN3R1EQ56T"
};

const app = initializeApp(firebaseConfig);

// ✅ Authentication (OTP login)
export const auth = getAuth(app);

// ✅ Firestore Database
export const db = getFirestore(app);

// ✅ Cloud Storage (for product images, uploads)
export const storage = getStorage(app);