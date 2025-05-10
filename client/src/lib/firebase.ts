import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useEffect, useState } from "react";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2agq-FmwzlRdRqTr_6-wsWZJzoUmDyts",
  authDomain: "legacy-cricket-academy.firebaseapp.com",
  projectId: "legacy-cricket-academy",
  storageBucket: "legacy-cricket-academy.appspot.com",
  messagingSenderId: "872043124420",
  appId: "1:872043124420:web:1a9f5998e4dcbf8f959b91",
  measurementId: "G-X6C1JRHE20",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      // Send email verification
      await sendEmailVerification(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Email/Password login
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
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