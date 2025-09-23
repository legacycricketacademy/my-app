import { useCallback } from 'react';

/**
 * Safe navigation hook that prevents navigation to the same path
 * and provides debugging capabilities
 */
export function useSafeNavigate() {
  return useCallback((path: string, options?: { replace?: boolean }) => {
    const currentPath = window.location.pathname;
    
    if (currentPath === path) {
      console.log(`[useSafeNavigate] Skipping navigation to same path: ${path}`);
      return;
    }
    
    console.log(`[useSafeNavigate] Navigating from ${currentPath} to ${path}`);
    
    if (options?.replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    
    // Trigger a popstate event to notify the router
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
}

/**
 * Component that renders null if already on target path, otherwise navigates
 */
export function SamePathSafeNavigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useSafeNavigate();
  
  // Check if we're already on the target path
  if (window.location.pathname === to) {
    return null;
  }
  
  // Navigate to the target path
  navigate(to, { replace });
  return null;
}

/**
 * Redirect sentry for debugging navigation issues
 */
export function RedirectSentry() {
  if (import.meta.env.VITE_ROUTE_DEBUG !== 'on') {
    return null;
  }
  
  // Log all pushState calls
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;
  
  window.history.pushState = function(...args) {
    console.log('[RedirectSentry] pushState called:', args);
    return originalPushState.apply(this, args);
  };
  
  window.history.replaceState = function(...args) {
    console.log('[RedirectSentry] replaceState called:', args);
    return originalReplaceState.apply(this, args);
  };
  
  // Log popstate events
  window.addEventListener('popstate', (event) => {
    console.log('[RedirectSentry] popstate event:', event);
  });
  
  return null;
}
