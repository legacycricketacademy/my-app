/**
 * Protected Route Components for Wouter Router
 * Provides authentication and role-based route protection
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getCurrentUser, getRole, hasRole, isAuthenticated, onAuthStateChange, initAuth, isAuthInitialized } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface RequireRoleProps extends ProtectedRouteProps {
  role: 'parent' | 'admin';
}

/**
 * RequireAuth - Requires any authenticated user
 */
export function RequireAuth({ children, fallback }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isAuthInitialized()) {
          await initAuth();
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChange((user) => {
      setIsAuth(!!user);
      
      if (!user) {
        setLocation('/auth');
      }
    });

    initializeAuth();
    return unsubscribe;
  }, [setLocation]);

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
          <button 
            onClick={() => setLocation('/auth')}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * RequireRole - Requires a specific role
 */
export function RequireRole({ children, role, fallback }: RequireRoleProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isAuthInitialized()) {
          await initAuth();
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setHasRequiredRole(hasRole(role));
      } else {
        setHasRequiredRole(false);
        setLocation('/auth');
      }
    });

    initializeAuth();
    return unsubscribe;
  }, [role, setLocation]);

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  if (!hasRequiredRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You need {role} permissions to access this page.
          </p>
          <button 
            onClick={() => setLocation('/dashboard')}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * AuthGuard - Higher-order component for route protection
 */
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: { requireAuth?: boolean; requireRole?: 'parent' | 'admin' } = {}
) {
  return function AuthGuardedComponent(props: T) {
    const { requireAuth = true, requireRole } = options;

    if (requireRole) {
      return (
        <RequireRole role={requireRole}>
          <Component {...props} />
        </RequireRole>
      );
    }

    if (requireAuth) {
      return (
        <RequireAuth>
          <Component {...props} />
        </RequireAuth>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * useAuth - Hook for accessing auth state
 */
export function useAuth() {
  const [user, setUser] = useState(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isAuthInitialized()) {
          await initAuth();
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    initializeAuth();
    return unsubscribe;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role || null,
    hasRole: (role: 'parent' | 'admin') => hasRole(role)
  };
}
