import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0Uj3CJGXYXq58HYlMwdTx_EucXqRBJGc",
  authDomain: "stock-e5732.firebaseapp.com",
  projectId: "stock-e5732",
  storageBucket: "stock-e5732.firebasestorage.app",
  messagingSenderId: "739927908116",
  appId: "1:739927908116:web:50956a7efd530d7621ec01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
