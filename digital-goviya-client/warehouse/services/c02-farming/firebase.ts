import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Same Firebase project as the React web frontend
const firebaseConfig = {
  apiKey: "AIzaSyBqs9kHOCJ5nBlRoGuWaPxuPRkBoUmXcmE",
  authDomain: "esp32-project01-1641b.firebaseapp.com",
  databaseURL: "https://esp32-project01-1641b-default-rtdb.firebaseio.com",
  projectId: "esp32-project01-1641b",
  storageBucket: "esp32-project01-1641b.firebasestorage.app",
  messagingSenderId: "394706839642",
  appId: "1:394706839642:web:3c1f355c45029c0bcd1063",
};

// Avoid duplicate app initialisation in Expo's Fast Refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
