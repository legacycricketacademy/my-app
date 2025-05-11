import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log configuration for debugging
console.log("Firebase configuration:", {
  apiKey: firebaseConfig.apiKey?.substring(0, 5) + "...",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId?.substring(0, 5) + "..."
});

// Initialize Firebase
let firebaseApp;

try {
  // Ensure environment variables are defined
  if (!import.meta.env.VITE_FIREBASE_API_KEY || 
      !import.meta.env.VITE_FIREBASE_PROJECT_ID || 
      !import.meta.env.VITE_FIREBASE_APP_ID) {
    throw new Error("Firebase environment variables are missing.");
  }
  
  // Initialize Firebase
  firebaseApp = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error: any) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Initialize and export Firebase Authentication
export const auth = getAuth(firebaseApp);

// Set persistence for better user experience
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Firebase auth persistence enabled"))
  .catch(error => console.error("Error setting auth persistence:", error));

export default firebaseApp;