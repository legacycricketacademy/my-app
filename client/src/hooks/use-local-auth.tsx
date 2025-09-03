/**
 * Temporary local authentication hook to bypass Firebase authentication issues
 */
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useLocalAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Local signup function - directly calls the backend without Firebase
  const signup = async (email: string, password: string, fullName: string, username: string, role: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Using local authentication signup for:", email);
      
      // Call backend directly to create user
      const response = await fetch("/api/auth/local-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password, 
          fullName,
          username,
          role
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Local signup error:", errorData);
        throw new Error(errorData.message || "Registration failed. Please try again later.");
      }

      const userData = await response.json();
      console.log("Local signup successful:", userData);
      
      // Show success message
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully.",
      });
      
      return userData;
    } catch (err: any) {
      console.error("Local signup error:", err);
      setError(err instanceof Error ? err : new Error(err.message || "An error occurred"));
      
      // Show error toast
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to create account. Please try again later.",
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Local login function - directly calls the backend without Firebase
  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Using local authentication login for:", username);
      
      // Call backend directly to authenticate
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Local login error:", errorData);
        throw new Error(errorData.message || "Login failed. Please check your credentials.");
      }

      const userData = await response.json();
      console.log("Local login successful:", userData);
      
      // Show success message
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
      
      return userData;
    } catch (err: any) {
      console.error("Local login error:", err);
      setError(err instanceof Error ? err : new Error(err.message || "An error occurred"));
      
      // Show error toast
      toast({
        title: "Login Failed",
        description: err.message || "Failed to log in. Please check your credentials.",
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Using local reset password for:", email);
      
      // Call backend to initiate password reset
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Password reset error:", errorData);
        throw new Error(errorData.message || "Password reset failed. Please try again later.");
      }

      console.log("Password reset email sent");
      
      // Show success message
      toast({
        title: "Password Reset Initiated",
        description: "If an account exists with that email, you will receive a password reset link.",
      });
      
      return true;
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err instanceof Error ? err : new Error(err.message || "An error occurred"));
      
      // Show error toast
      toast({
        title: "Password Reset Failed",
        description: err.message || "Failed to initiate password reset. Please try again later.",
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signup,
    login,
    resetPassword
  };
}