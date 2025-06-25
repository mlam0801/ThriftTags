// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDD9HzGwvBbA9O9ePtFjRSmiwsIsszZm0c",
  authDomain: "thrifttags-c19de.firebaseapp.com",
  projectId: "thrifttags-c19de",
  storageBucket: "thrifttags-c19de.firebasestorage.app",
  messagingSenderId: "1045328256355",
  appId: "1:1045328256355:web:64ba5ca59c7fd71f75c756",
  measurementId: "G-242JR1V1TF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };