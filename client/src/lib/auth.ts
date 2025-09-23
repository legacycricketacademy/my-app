import { config } from '../config';
import { 
  getAuthSnapshot, 
  subscribeAuth, 
  setUser, 
  setReady, 
  initAuthOnce, 
  signOutStore,
  type AuthUser,
  type Role
} from './auth-store';

// Types (re-export from store for compatibility)
export type User = AuthUser;
export type { Role } from './auth-store';

export interface AuthState {
  user: User | null;
  isInitialized: boolean;
}

// Auth state change subscription
export function onAuthStateChange(fn: (user: User | null) => void): () => void {
  return subscribeAuth(() => {
    const snapshot = getAuthSnapshot();
    fn(snapshot.user);
  });
}

// Initialize authentication
export function initAuth(): Promise<void> {
  return initAuthOnce(async () => {
    const provider = config.authProvider;
    console.log('Auth: Initializing with provider:', provider);
    
    if (provider === 'mock') {
      // For mock, we'll let the store handle localStorage restoration
      return null; // Store will handle localStorage
    }
    
    // For other providers, implement actual authentication
    return null;
  });
}

// Sign in
export async function signIn({ email, password }: { email: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  const provider = config.authProvider;
  
  if (provider === 'mock') {
    // Mock authentication - derive role from email
    const role = /admin@/i.test(email) ? 'admin' : 'parent';
    
    // Mock authentication - accept any password for testing
    // In real implementation, this would validate credentials
    
    const user: AuthUser = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      email,
      role,
    };
    
    console.log('Auth: User signed in:', user);
    setUser(user);
    
    return { ok: true };
  }
  
  // For other providers, you would implement actual authentication
  return { ok: false, error: 'Authentication provider not implemented' };
}

// Sign out
export function signOut(): void {
  signOutStore();
}

// Get current user
export function getCurrentUser(): User | null {
  return getAuthSnapshot().user;
}

// Get user role
export function getRole(): string | null {
  return getAuthSnapshot().role;
}

// Check if auth is initialized
export function isAuthInitialized(): boolean {
  return getAuthSnapshot().ready;
}

// Get auth provider
export function getAuthProvider(): string {
  return config.authProvider;
}

// Get auth token
export function getToken(): string | null {
  const user = getCurrentUser();
  if (!user) return null;
  return `Bearer mock:${user.id}:${user.role}`;
}

// Refresh token (for API retry)
export function refreshToken(): string | null {
  return getToken(); // Mock tokens are static
}

// Check if user has specific role
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === role;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Reset auth state (for testing)
export function resetAuth(): void {
  signOutStore();
  setReady(false);
}