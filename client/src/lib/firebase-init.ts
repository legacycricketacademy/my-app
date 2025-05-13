import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, Auth } from "firebase/auth";

// Initialize Firebase with fallbacks
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
  // Check if Firebase environment variables are defined
  if (import.meta.env.VITE_FIREBASE_API_KEY && 
      import.meta.env.VITE_FIREBASE_PROJECT_ID && 
      import.meta.env.VITE_FIREBASE_APP_ID) {
    
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
    firebaseApp = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
    
    // Initialize Firebase Authentication
    auth = getAuth(firebaseApp);
    
    // Set persistence for better user experience
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log("Firebase auth persistence enabled"))
      .catch(error => console.error("Error setting auth persistence:", error));
  } else {
    console.warn("Firebase environment variables are missing. Firebase authentication will be disabled.");
  }
} catch (error: any) {
  console.error("Firebase initialization error:", error);
  console.warn("Continuing without Firebase authentication");
}

export { auth };
export default firebaseApp;