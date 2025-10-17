/**
 * Session-based Auth Provider
 * Simple authentication using server sessions
 */

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Auth context type
interface AuthContextType {
  user: { id: number; role: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginMutation: any;
  logoutMutation: any;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  loginMutation: {},
  logoutMutation: {}
});

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch current session
  const {
    data: sessionData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['/api/session'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/session', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            return { authenticated: false, user: null };
          }
          throw new Error('Failed to fetch session data');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching session data:', error);
        return { authenticated: false, user: null };
      }
    },
    retry: 1,
    staleTime: 30000, // Cache results for 30 seconds
  });
  
  // Extract user and authentication state
  const user = sessionData?.authenticated ? sessionData.user : null;
  const isAuthenticated = !!user;
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const loginResponse = await fetch('/api/dev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const loginData = await loginResponse.json();
      
      if (!loginData.ok || !loginData.user) {
        throw new Error('Login response invalid');
      }

      // Verify session after login
      const sessionResponse = await fetch('/api/session', {
        credentials: 'include'
      });

      if (!sessionResponse.ok) {
        throw new Error('Session verification failed');
      }

      const sessionData = await sessionResponse.json();
      
      if (!sessionData.authenticated || !sessionData.user) {
        throw new Error('Login succeeded but session missing; check cookies');
      }

      return sessionData;
    },
    onSuccess: (response) => {
      // Update session data in cache
      queryClient.setQueryData(['/api/session'], response);
      
      // Show success toast
      toast({
        title: "Login successful",
        description: "Welcome back!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive"
      });
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Clear session data from cache
      queryClient.setQueryData(['/api/session'], { authenticated: false, user: null });
      
      // Clear all queries
      queryClient.clear();
      
      // Show success toast
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      
      // Hard navigate to auth page
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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    loginMutation,
    logoutMutation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
