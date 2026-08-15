// Import the functions you need from the SDKs you need

import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqs9kHOCJ5nBlRoGuWaPxuPRkBoUmXcmE",
  authDomain: "esp32-project01-1641b.firebaseapp.com",
  databaseURL: "https://esp32-project01-1641b-default-rtdb.firebaseio.com",
  projectId: "esp32-project01-1641b",
  storageBucket: "esp32-project01-1641b.firebasestorage.app",
  messagingSenderId: "394706839642",
  appId: "1:394706839642:web:3c1f355c45029c0bcd1063"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);