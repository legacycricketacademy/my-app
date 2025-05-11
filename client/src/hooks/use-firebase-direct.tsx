import { useState } from 'react';
import { signUpWithEmail, signInWithEmail, sendPasswordReset } from '@/lib/firebase-direct';

export function useFirebaseDirect() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Sign up with email/password
  const signup = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await signUpWithEmail(email, password, displayName);
      setUser(userData);
      return userData;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err.message || 'An error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email/password
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await signInWithEmail(email, password);
      setUser(userData);
      return userData;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err.message || 'An error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await sendPasswordReset(email);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err.message || 'An error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    // Clear any stored tokens
    localStorage.removeItem('firebase_token');
    sessionStorage.removeItem('firebase_token');
    return true;
  };

  return {
    user,
    loading,
    error,
    signup,
    login,
    resetPassword,
    logout
  };
}