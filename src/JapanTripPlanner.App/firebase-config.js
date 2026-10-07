// Firebase Configuration Template (Public Repository)
// In production, GitHub Actions replaces this file with your FIREBASE_CONFIG secret before building Docker.
// For local development, create firebase-config.local.js (which is ignored by Git).
window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
