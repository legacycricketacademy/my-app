/**
 * Unified Authentication Client
 * Provides a consistent API for authentication across the app
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase-init';

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

// Current user state
let currentUser: AuthUser | null = null;
let authListeners: ((user: AuthUser | null) => void)[] = [];

// Initialize auth state listener
if (auth) {
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
  });
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

/**
 * Sign in with email and password
 */
export async function signIn(credentials: LoginCredentials): Promise<AuthUser> {
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
    // For development, try mock authentication if Firebase fails
    if (process.env.NODE_ENV === 'development' && MOCK_USERS[credentials.email]) {
      const mockUser = MOCK_USERS[credentials.email];
      if (credentials.password === 'Test1234!') {
        currentUser = mockUser;
        return mockUser;
      }
    }
    
    throw new Error(error.message || 'Sign in failed');
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
  currentUser = null;
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
    
    // In a real app, you would set custom claims here
    // For now, we'll use mock data for role
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
