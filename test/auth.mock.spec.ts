import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  initAuth, 
  signIn, 
  signOut, 
  getCurrentUser, 
  getRole, 
  isAuthInitialized, 
  getAuthProvider, 
  getToken, 
  hasRole, 
  isAuthenticated,
  onAuthStateChange,
  resetAuth
} from '../client/src/lib/auth';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window and localStorage for Node.js environment
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
  },
  writable: true,
});

// Also define localStorage directly on global for compatibility
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
  },
});

describe('Mock Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    // Reset module state
    vi.resetModules();
  });

  describe('initAuth', () => {
    it('should initialize auth only once', async () => {
      const promise1 = initAuth();
      const promise2 = initAuth();
      
      expect(promise1).toBe(promise2);
      await promise1;
      expect(isAuthInitialized()).toBe(true);
    });

    it('should restore user from localStorage', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'admin@test.com',
        role: 'admin' as const,
        name: 'admin'
      };
      
      // Reset auth state completely
      resetAuth();
      
      // Mock localStorage to return the user
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      await initAuth();
      
      expect(getCurrentUser()).toEqual(mockUser);
      expect(isAuthenticated()).toBe(true);
    });

    it('should handle invalid localStorage data', async () => {
      // Reset auth state first
      resetAuth();
      
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      await initAuth();
      
      expect(getCurrentUser()).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('signIn', () => {
    beforeEach(async () => {
      await initAuth();
    });

    it('should sign in admin user', async () => {
      const result = await signIn({ email: 'admin@test.com', password: 'password123' });
      
      expect(result.ok).toBe(true);
      expect(getCurrentUser()).toEqual({
        id: 'mock-uuid-123',
        email: 'admin@test.com',
        role: 'admin',
        name: 'admin'
      });
      expect(getRole()).toBe('admin');
      expect(hasRole('admin')).toBe(true);
    });

    it('should sign in parent user', async () => {
      const result = await signIn({ email: 'parent@test.com', password: 'password123' });
      
      expect(result.ok).toBe(true);
      expect(getCurrentUser()).toEqual({
        id: 'mock-uuid-123',
        email: 'parent@test.com',
        role: 'parent',
        name: 'parent'
      });
      expect(getRole()).toBe('parent');
      expect(hasRole('parent')).toBe(true);
    });

    it('should accept any password in mock mode', async () => {
      const result = await signIn({ email: 'admin@test.com', password: 'wrong' });
      
      expect(result.ok).toBe(true);
      expect(getCurrentUser()).not.toBeNull();
      expect(getCurrentUser()?.email).toBe('admin@test.com');
    });

    it('should store user in localStorage', async () => {
      await signIn({ email: 'admin@test.com', password: 'password123' });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth:user',
        JSON.stringify({
          id: 'mock-uuid-123',
          email: 'admin@test.com',
          role: 'admin',
          name: 'admin'
        })
      );
    });
  });

  describe('signOut', () => {
    beforeEach(async () => {
      await initAuth();
      await signIn({ email: 'admin@test.com', password: 'password123' });
    });

    it('should clear user and localStorage', () => {
      signOut();
      
      expect(getCurrentUser()).toBeNull();
      expect(isAuthenticated()).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth:user');
    });
  });

  describe('getToken', () => {
    beforeEach(async () => {
      await initAuth();
    });

    it('should return null when not authenticated', () => {
      expect(getToken()).toBeNull();
    });

    it('should return mock token when authenticated', async () => {
      await signIn({ email: 'admin@test.com', password: 'password123' });
      
      expect(getToken()).toBe('Bearer mock:mock-uuid-123:admin');
    });
  });

  describe('onAuthStateChange', () => {
    beforeEach(async () => {
      await initAuth();
    });

    it('should notify listeners on sign in', async () => {
      const listener = vi.fn();
      const unsubscribe = onAuthStateChange(listener);
      
      await signIn({ email: 'admin@test.com', password: 'password123' });
      
      expect(listener).toHaveBeenCalledWith({
        id: 'mock-uuid-123',
        email: 'admin@test.com',
        role: 'admin',
        name: 'admin'
      });
      
      unsubscribe();
    });

    it('should notify listeners on sign out', async () => {
      await signIn({ email: 'admin@test.com', password: 'password123' });
      
      const listener = vi.fn();
      const unsubscribe = onAuthStateChange(listener);
      
      signOut();
      
      expect(listener).toHaveBeenCalledWith(null);
      
      unsubscribe();
    });

    it('should allow unsubscribing', async () => {
      const listener = vi.fn();
      const unsubscribe = onAuthStateChange(listener);
      
      unsubscribe();
      
      await signIn({ email: 'admin@test.com', password: 'password123' });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getAuthProvider', () => {
    it('should return mock provider', () => {
      expect(getAuthProvider()).toBe('mock');
    });
  });
});

