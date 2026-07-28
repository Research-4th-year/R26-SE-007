// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOCSmSVYobKE5ZUZAqGCst2BtoHuGh6-k",
  authDomain: "research-4y2s.firebaseapp.com",
  projectId: "research-4y2s",
  storageBucket: "research-4y2s.firebasestorage.app",
  messagingSenderId: "539642710323",
  appId: "1:539642710323:web:fc59fef1485ddd99715646",
  measurementId: "G-0MDNLXR3L6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);