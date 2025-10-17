/**
 * Auth Context - Provider for authentication state management
 * Using the unified auth service for all authentication operations
 */

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import * as authService from '@/services/auth-service';

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  firebaseUser: any;
  firebaseLoading: boolean;
  login: (data: authService.LoginData) => Promise<authService.AuthResponse<User>>;
  register: (data: authService.RegisterData) => Promise<authService.AuthResponse<User>>;
  logout: () => Promise<authService.AuthResponse>;
  resetPassword: (email: string) => Promise<authService.AuthResponse>;
  isSpecialEmail: (email: string) => boolean;
  loginMutation: any;
  registerMutation: any;
  logoutMutation: any;
  resetPasswordMutation: any;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  firebaseUser: null,
  firebaseLoading: false,
  login: async () => ({ success: false, message: 'Auth context not initialized' }),
  register: async () => ({ success: false, message: 'Auth context not initialized' }),
  logout: async () => ({ success: false, message: 'Auth context not initialized' }),
  resetPassword: async () => ({ success: false, message: 'Auth context not initialized' }),
  isSpecialEmail: () => false,
  loginMutation: {},
  registerMutation: {},
  logoutMutation: {},
  resetPasswordMutation: {}
});

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Firebase user state (for dual auth tracking)
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [firebaseLoading, setFirebaseLoading] = useState<boolean>(true);
  
  // Setup Firebase auth state listener
  useEffect(() => {
    try {
      // Import Firebase auth
      import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
        const auth = getAuth();
        
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setFirebaseUser(user);
          setFirebaseLoading(false);
        });
        
        // Cleanup on unmount
        return () => unsubscribe();
      }).catch((error) => {
        console.error("Failed to initialize Firebase auth listener:", error);
        setFirebaseLoading(false);
      });
    } catch (error) {
      console.error("Error setting up Firebase auth listener:", error);
      setFirebaseLoading(false);
    }
  }, []);
  
  // Check for logout params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const logoutParam = params.get('logout');
    
    if (logoutParam) {
      // User was redirected with ?logout parameter
      // Clear any auth state and invalidate queries
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries();
      
      // Show logout confirmation
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    }
  }, []);
  
  // Fetch current user data
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            return null; // Not authenticated
          }
          throw new Error('Failed to fetch user data');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    }
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      if (response.success) {
        // Update user data in cache
        queryClient.setQueryData(['/api/user'], response.data);
        
        // Show success toast
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
      } else {
        // Show error toast
        toast({
          title: "Login failed",
          description: response.message,
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive"
      });
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (response) => {
      if (response.success) {
        // Update user data in cache
        queryClient.setQueryData(['/api/user'], response.data);
        
        // Show success toast
        toast({
          title: "Registration successful",
          description: "Your account has been created"
        });
      } else {
        // Show error toast
        toast({
          title: "Registration failed",
          description: response.message,
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: (response) => {
      // Clear user data from cache
      queryClient.setQueryData(['/api/user'], null);
      
      // Clear all queries
      queryClient.clear();
      
      // Show success toast
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
      
      // Redirect to auth page with hard navigation
      window.location.href = '/auth';
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive"
      });
    }
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: (response) => {
      if (response.success) {
        // Show success toast
        toast({
          title: "Password reset email sent",
          description: response.message
        });
      } else {
        // Show error toast
        toast({
          title: "Password reset failed",
          description: response.message,
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message || "An error occurred during password reset",
        variant: "destructive"
      });
    }
  });
  
  // Wrapper functions for mutations
  const login = async (data: authService.LoginData) => {
    return loginMutation.mutateAsync(data);
  };
  
  const register = async (data: authService.RegisterData) => {
    return registerMutation.mutateAsync(data);
  };
  
  const logout = async () => {
    return logoutMutation.mutateAsync();
  };
  
  const resetPassword = async (email: string) => {
    return resetPasswordMutation.mutateAsync(email);
  };
  
  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    error,
    firebaseUser,
    firebaseLoading,
    login,
    register,
    logout,
    resetPassword,
    isSpecialEmail: authService.isSpecialEmail,
    loginMutation,
    registerMutation,
    logoutMutation,
    resetPasswordMutation
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}