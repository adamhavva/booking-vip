// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC746BFn5lrCKusCWujOlRk4gDtzLU8gRk",
  authDomain: "vip-book-6cfe2.firebaseapp.com",
  projectId: "vip-book-6cfe2",
  storageBucket: "vip-book-6cfe2.firebasestorage.app",
  messagingSenderId: "180570274571",
  appId: "1:180570274571:web:d51725e447ccb29f70400e",
  measurementId: "G-S3T85X68H7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);