import React, { useState, useEffect } from 'react';
import { getCurrentUser, getRole, isAuthInitialized, onAuthStateChange } from '@/lib/auth';
import { getAuthSnapshot, subscribeAuth } from '@/lib/auth-store';
import { SamePathSafeNavigate } from '@/lib/router';

// Full page spinner component
function FullPageSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{label}</p>
      </div>
    </div>
  );
}

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const [authState, setAuthState] = useState(getAuthSnapshot());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeAuth(() => {
      const snapshot = getAuthSnapshot();
      console.log('RequireAuth: Auth state changed:', snapshot);
      setAuthState(snapshot);
    });

    // Set initial state
    setAuthState(getAuthSnapshot());

    return unsubscribe;
  }, []);

  if (!authState.ready) {
    console.log('RequireAuth: Not ready, showing spinner');
    return <FullPageSpinner label="Preparing your session..." />;
  }

  if (!authState.user) {
    console.log('RequireAuth: No user, redirecting to auth');
    return <SamePathSafeNavigate to="/auth" replace />;
  }

  console.log('RequireAuth: User authenticated, rendering children');
  return <>{children}</>;
}

interface RequireRoleProps {
  children: React.ReactNode;
  role: string;
}

export function RequireRole({ children, role }: RequireRoleProps) {
  const [authState, setAuthState] = useState(getAuthSnapshot());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeAuth(() => {
      const snapshot = getAuthSnapshot();
      console.log('RequireRole: Auth state changed:', snapshot);
      setAuthState(snapshot);
    });

    // Set initial state
    setAuthState(getAuthSnapshot());

    return unsubscribe;
  }, []);

  if (!authState.ready) {
    return <FullPageSpinner label="Checking permissions..." />;
  }

  if (!authState.user) {
    return <SamePathSafeNavigate to="/auth" replace />;
  }

  console.log(`RequireRole: Checking role for ${role}, user role: ${authState.role}, user:`, authState.user);
  
  if (authState.role !== role) {
    console.log(`RequireRole: User role ${authState.role} does not match required role ${role}, redirecting to /`);
    return <SamePathSafeNavigate to="/" replace />;
  }
  
  console.log(`RequireRole: Role check passed, rendering children`);
  return <>{children}</>;
}