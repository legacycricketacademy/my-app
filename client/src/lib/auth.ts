/**
 * Unified Authentication Client
 * Supports multiple authentication providers: Keycloak, Firebase, and Mock
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase-init';
import Keycloak from 'keycloak-js';

export type AuthProvider = 'keycloak' | 'firebase' | 'mock';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'admin';
  isEmailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Get auth provider from environment
const AUTH_PROVIDER: AuthProvider = (import.meta.env.VITE_AUTH_PROVIDER as AuthProvider) || 'mock';

// Mock users for development
const MOCK_USERS: Record<string, AuthUser> = {
  'parent@test.com': {
    id: 'parent-1',
    email: 'parent@test.com',
    name: 'Test Parent',
    role: 'parent',
    isEmailVerified: true
  },
  'admin@test.com': {
    id: 'admin-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin',
    isEmailVerified: true
  }
};

// Global state
let currentUser: AuthUser | null = null;
let authListeners: ((user: AuthUser | null) => void)[] = [];
let isInitialized = false;
let keycloak: Keycloak | null = null;

/**
 * Initialize authentication based on provider
 */
export async function initAuth(): Promise<void> {
  if (isInitialized) return;

  console.log(`Initializing auth with provider: ${AUTH_PROVIDER}`);

  switch (AUTH_PROVIDER) {
    case 'keycloak':
      await initKeycloakAuth();
      break;
    case 'firebase':
      await initFirebaseAuth();
      break;
    case 'mock':
      await initMockAuth();
      break;
    default:
      throw new Error(`Unknown auth provider: ${AUTH_PROVIDER}`);
  }

  isInitialized = true;
}

/**
 * Initialize Keycloak authentication
 */
async function initKeycloakAuth(): Promise<void> {
  const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
  const realm = import.meta.env.VITE_KEYCLOAK_REALM;
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

  if (!keycloakUrl || !realm || !clientId) {
    throw new Error('Keycloak environment variables not configured');
  }

  keycloak = new Keycloak({
    url: keycloakUrl,
    realm,
    clientId
  });

  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      flow: 'standard'
    });

    if (authenticated) {
      await updateUserFromKeycloak();
    }
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    throw error;
  }
}

/**
 * Initialize Firebase authentication
 */
async function initFirebaseAuth(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Get user role from Firebase custom claims or fallback to mock
        const tokenResult = await firebaseUser.getIdTokenResult();
        const role = tokenResult.claims.role as 'parent' | 'admin' || 
                     (MOCK_USERS[firebaseUser.email || '']?.role) || 'parent';
        
        currentUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role,
          isEmailVerified: firebaseUser.emailVerified
        };
      } else {
        currentUser = null;
      }
      
      // Notify all listeners
      authListeners.forEach(listener => listener(currentUser));
      resolve();
    });
  });
}

/**
 * Initialize Mock authentication
 */
async function initMockAuth(): Promise<void> {
  // Mock auth is always ready
  currentUser = null;
  authListeners.forEach(listener => listener(currentUser));
}

/**
 * Update user from Keycloak token
 */
async function updateUserFromKeycloak(): Promise<void> {
  if (!keycloak || !keycloak.authenticated) {
    currentUser = null;
    authListeners.forEach(listener => listener(currentUser));
    return;
  }

  try {
    // Refresh token if needed
    await keycloak.updateToken(30);
    
    const token = keycloak.token;
    const tokenParsed = keycloak.tokenParsed;
    
    if (!tokenParsed) {
      currentUser = null;
      authListeners.forEach(listener => listener(currentUser));
      return;
    }

    // Extract role from Keycloak token
    const realmRoles = tokenParsed.realm_access?.roles || [];
    const resourceRoles = tokenParsed.resource_access?.[keycloak.clientId || '']?.roles || [];
    const allRoles = [...realmRoles, ...resourceRoles];
    
    // Map roles: if 'admin' role present, use admin; otherwise parent
    const role = allRoles.includes('admin') ? 'admin' : 'parent';

    currentUser = {
      id: tokenParsed.sub || '',
      email: tokenParsed.email || tokenParsed.preferred_username || '',
      name: tokenParsed.name || tokenParsed.preferred_username || 'User',
      role,
      isEmailVerified: tokenParsed.email_verified || false
    };

    authListeners.forEach(listener => listener(currentUser));
  } catch (error) {
    console.error('Error updating user from Keycloak:', error);
    currentUser = null;
    authListeners.forEach(listener => listener(currentUser));
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

/**
 * Get the current authentication token
 */
export async function getToken(): Promise<string | null> {
  switch (AUTH_PROVIDER) {
    case 'keycloak':
      if (!keycloak || !keycloak.authenticated) return null;
      try {
        await keycloak.updateToken(30);
        return keycloak.token || null;
      } catch (error) {
        console.error('Error refreshing Keycloak token:', error);
        return null;
      }
    case 'firebase':
      if (!auth?.currentUser) return null;
      return await auth.currentUser.getIdToken();
    case 'mock':
      return currentUser ? 'mock-token-' + currentUser.id : null;
    default:
      return null;
  }
}

/**
 * Sign in with the configured provider
 */
export async function signIn(credentials?: LoginCredentials): Promise<AuthUser> {
  switch (AUTH_PROVIDER) {
    case 'keycloak':
      if (!keycloak) {
        throw new Error('Keycloak not initialized');
      }
      await keycloak.login();
      // The actual user will be set in updateUserFromKeycloak after redirect
      // Don't throw error, just return a promise that never resolves
      return new Promise(() => {});
      
    case 'firebase':
      return await signInWithFirebase(credentials!);
      
    case 'mock':
      return await signInWithMock(credentials!);
      
    default:
      throw new Error(`Unknown auth provider: ${AUTH_PROVIDER}`);
  }
}

/**
 * Sign in with Firebase
 */
async function signInWithFirebase(credentials: LoginCredentials): Promise<AuthUser> {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      credentials.email, 
      credentials.password
    );
    
    const firebaseUser = userCredential.user;
    
    // Get user role from custom claims or mock data
    const tokenResult = await firebaseUser.getIdTokenResult();
    const role = tokenResult.claims.role as 'parent' | 'admin' || 
                 (MOCK_USERS[firebaseUser.email || '']?.role) || 'parent';
    
    const user: AuthUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role,
      isEmailVerified: firebaseUser.emailVerified
    };
    
    currentUser = user;
    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Sign in failed');
  }
}

/**
 * Sign in with Mock authentication
 */
async function signInWithMock(credentials: LoginCredentials): Promise<AuthUser> {
  const mockUser = MOCK_USERS[credentials.email];
  
  if (!mockUser || credentials.password !== 'Test1234!') {
    throw new Error('Invalid credentials');
  }
  
  currentUser = mockUser;
  authListeners.forEach(listener => listener(currentUser));
  return mockUser;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  switch (AUTH_PROVIDER) {
    case 'keycloak':
      if (keycloak) {
        await keycloak.logout();
      }
      break;
    case 'firebase':
      if (auth) {
        await firebaseSignOut(auth);
      }
      break;
    case 'mock':
      // Mock signout - clear user and notify listeners
      currentUser = null;
      authListeners.forEach(listener => listener(currentUser));
      break;
  }
  
  // For Keycloak and Firebase, the auth state change will be handled by their respective listeners
  if (AUTH_PROVIDER === 'mock') {
    // Already handled above
  } else {
    currentUser = null;
    authListeners.forEach(listener => listener(currentUser));
  }
}

/**
 * Get the current user's role
 */
export function getRole(): 'parent' | 'admin' | null {
  return currentUser?.role || null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(role: 'parent' | 'admin'): boolean {
  return currentUser?.role === role;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentUser !== null;
}

/**
 * Check if auth is initialized
 */
export function isAuthInitialized(): boolean {
  return isInitialized;
}

/**
 * Get the current auth provider
 */
export function getAuthProvider(): AuthProvider {
  return AUTH_PROVIDER;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(listener: (user: AuthUser | null) => void): () => void {
  authListeners.push(listener);
  
  // Call immediately with current state
  listener(currentUser);
  
  // Return unsubscribe function
  return () => {
    const index = authListeners.indexOf(listener);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
}

/**
 * Create a new user account (for development/testing)
 */
export async function createUser(credentials: LoginCredentials & { name: string; role: 'parent' | 'admin' }): Promise<AuthUser> {
  if (AUTH_PROVIDER !== 'firebase') {
    throw new Error('User creation only supported with Firebase provider');
  }

  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    
    const firebaseUser = userCredential.user;
    
    // Set display name
    await firebaseUser.updateProfile({
      displayName: credentials.name
    });
    
    const user: AuthUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: credentials.name,
      role: credentials.role,
      isEmailVerified: firebaseUser.emailVerified
    };
    
    currentUser = user;
    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Account creation failed');
  }
}
