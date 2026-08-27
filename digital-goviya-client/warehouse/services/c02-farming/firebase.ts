import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

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

// Use initializeAuth (not getAuth) to wire up AsyncStorage persistence
// @react-native-async-storage/async-storage v2 uses default import
export const auth =
  getApps().length === 1
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      })
    : getAuth(app);
export const database = getDatabase(app);
