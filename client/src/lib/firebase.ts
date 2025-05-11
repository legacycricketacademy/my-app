import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useEffect, useState } from "react";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Optional configurations - if you have these values, uncomment them
  // messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase - ensure we only initialize once
console.log("Firebase configuration:", {
  apiKey: firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId
});

// Helper to get existing app or initialize a new one
let app;
try {
  // Check if the environment variables are defined
  if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID || !import.meta.env.VITE_FIREBASE_APP_ID) {
    throw new Error("Firebase environment variables are missing. Please check your .env file.");
  }
  
  // Initialize Firebase with config
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error: any) {
  console.error("Firebase initialization error:", error);
  throw error;
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firebase auth hooks
export function useFirebaseAuth() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Email/Password signup
  const signup = async (email: string, password: string, displayName: string) => {
    try {
      console.log("Firebase signup: Checking auth initialization");
      if (!auth) {
        console.error("Auth is not initialized:", auth);
        throw new Error("Firebase auth is not initialized");
      }
      
      console.log("Firebase signup: Attempting to create user with email", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase signup: User created successfully", userCredential.user.uid);
      
      // Update profile with display name
      console.log("Firebase signup: Updating profile with display name");
      await updateProfile(userCredential.user, { displayName });
      
      // Send email verification
      console.log("Firebase signup: Sending email verification");
      await sendEmailVerification(userCredential.user);
      
      console.log("Firebase signup: Process completed successfully");
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        fullError: JSON.stringify(error)
      });
      throw error; // Throw the original error to preserve all details
    }
  };

  // Email/Password login
  const login = async (email: string, password: string) => {
    try {
      console.log("Firebase login: Checking auth initialization");
      if (!auth) {
        console.error("Auth is not initialized:", auth);
        throw new Error("Firebase auth is not initialized");
      }
      
      console.log("Firebase login: Attempting to sign in with email", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase login: User signed in successfully", userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase login error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        fullError: JSON.stringify(error)
      });
      throw error; // Throw the original error to preserve all details
    }
  };
  
  // Google sign-in
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Password reset
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return {
    currentUser,
    loading,
    signup,
    login,
    signInWithGoogle,
    resetPassword,
    logout
  };
}