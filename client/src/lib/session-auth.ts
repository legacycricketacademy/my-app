/**
 * Session-based Authentication Service
 * Handles login/logout with proper session verification
 */

export interface User {
  id: number;
  role: string;
}

export interface LoginResponse {
  ok: boolean;
  user: User;
}

export interface SessionResponse {
  authenticated: boolean;
  user: User | null;
}

export interface WhoamiResponse {
  id: number;
  role: string;
}

class SessionAuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Set up axios defaults for credentials
    this.setupAxiosDefaults();
  }

  private setupAxiosDefaults() {
    // This will be handled by the main app bootstrap
    console.log('SessionAuthService: Setting up credentials for all requests');
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // Step 1: Call login endpoint
      const loginResponse = await fetch('/api/dev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const loginData: LoginResponse = await loginResponse.json();
      
      if (!loginData.ok || !loginData.user) {
        throw new Error('Login response invalid');
      }

      // Step 2: Verify session by calling whoami
      const whoamiResponse = await fetch('/api/whoami', {
        credentials: 'include'
      });

      if (!whoamiResponse.ok) {
        throw new Error('Session verification failed');
      }

      const whoamiData: WhoamiResponse = await whoamiResponse.json();
      
      if (!whoamiData.id || !whoamiData.role) {
        throw new Error('Session verification returned invalid user data');
      }

      // Step 3: Set user state
      this.currentUser = {
        id: whoamiData.id,
        role: whoamiData.role
      };

      this.notifyListeners();
      return this.currentUser;

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Logout request failed:', response.status);
      }

      // Clear local state
      this.currentUser = null;
      this.notifyListeners();

      // Force navigation to login page
      window.location.href = '/login';

    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state and redirect
      this.currentUser = null;
      this.notifyListeners();
      window.location.href = '/login';
    }
  }

  /**
   * Check current session status
   */
  async checkSession(): Promise<User | null> {
    try {
      const response = await fetch('/api/session', {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      const data: SessionResponse = await response.json();
      
      if (data.authenticated && data.user) {
        this.currentUser = data.user;
        this.notifyListeners();
        return this.currentUser;
      }

      this.currentUser = null;
      this.notifyListeners();
      return null;

    } catch (error) {
      console.error('Session check error:', error);
      this.currentUser = null;
      this.notifyListeners();
      return null;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    
    // Call immediately with current state
    listener(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

// Export singleton instance
export const sessionAuth = new SessionAuthService();
