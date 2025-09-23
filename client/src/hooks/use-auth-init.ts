import { useEffect, useState } from 'react';
import { initAuth, isAuthInitialized, getCurrentUser, onAuthStateChange } from '@/lib/auth';

/**
 * Custom hook for single-run auth initialization
 * Prevents duplicate initialization calls
 */
export function useAuthInit() {
  const [isReady, setIsReady] = useState(isAuthInitialized());
  const [user, setUser] = useState(getCurrentUser());
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      if (isAuthInitialized()) {
        // Auth is already initialized, just set the user and ready state
        if (isMounted) {
          console.log('[useAuthInit] Auth already initialized, setting user');
          setIsReady(true);
          setUser(getCurrentUser());
        }
        return;
      }
      
      if (isInitializing) {
        return;
      }
      
      setIsInitializing(true);
      console.log('[useAuthInit] Starting auth initialization');
      
      try {
        await initAuth();
        if (isMounted) {
          console.log('[useAuthInit] Auth initialization complete');
          setIsReady(true);
          setUser(getCurrentUser());
        }
      } catch (error) {
        console.error('[useAuthInit] Auth initialization failed:', error);
        if (isMounted) {
          setIsReady(true); // Still mark as ready to prevent infinite loading
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, [isInitializing]);

  useEffect(() => {
    if (!isReady) return;
    
    const unsubscribe = onAuthStateChange((newUser) => {
      console.log('[useAuthInit] Auth state changed:', newUser);
      setUser(newUser);
    });
    
    return unsubscribe;
  }, [isReady]);

  return { isReady, user, isInitializing };
}
