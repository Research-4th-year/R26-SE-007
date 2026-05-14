import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBqs9kHOCJ5nBlRoGuWaPxuPRkBoUmXcmE",
  authDomain: "esp32-project01-1641b.firebaseapp.com",
  databaseURL: "https://esp32-project01-1641b-default-rtdb.firebaseio.com",
  projectId: "esp32-project01-1641b",
  storageBucket: "esp32-project01-1641b.firebasestorage.app",
  messagingSenderId: "394706839642",
  appId: "1:394706839642:web:3c1f355c45029c0bcd1063"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export default app;
