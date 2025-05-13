import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from "firebase/auth";
import { useEffect, useState } from "react";

// Import Firebase and Auth from our initialization file
import firebaseApp, { auth } from "./firebase-init";

// Create Google provider
export const googleProvider = new GoogleAuthProvider();

// Firebase auth hooks
export function useFirebaseAuth() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle case where auth is null (Firebase not initialized)
    if (!auth) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Helper function to check if auth is available
  const checkAuth = (): Auth => {
    if (!auth) {
      console.warn("Firebase auth is not initialized, falling back to direct authentication");
      throw new Error("Firebase auth is not available");
    }
    return auth;
  };

  // Email/Password signup
  const signup = async (email: string, password: string, displayName: string) => {
    try {
      console.log("Firebase signup: Checking auth initialization");
      const authInstance = checkAuth();
      
      console.log("Firebase signup: Attempting to create user with email", email);
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
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
      const authInstance = checkAuth();
      
      console.log("Firebase login: Attempting to sign in with email", email);
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
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
      const authInstance = checkAuth();
      const result = await signInWithPopup(authInstance, googleProvider);
      return result.user;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  // Password reset
  const resetPassword = async (email: string) => {
    try {
      const authInstance = checkAuth();
      await sendPasswordResetEmail(authInstance, email);
      return true;
    } catch (error: any) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (!auth) {
        console.warn("No active Firebase session to log out from");
        return true;
      }
      await signOut(auth);
      return true;
    } catch (error: any) {
      console.error("Logout error:", error);
      throw error;
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