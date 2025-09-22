/**
 * API wrapper for making HTTP requests to the backend
 * Provides consistent error handling and JSON parsing
 */

import { getToken, getAuthProvider } from './auth';
import { getApiUrl } from '../config';

const API_BASE_URL = getApiUrl('');

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: { status: number; code: string; message?: string } };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Refresh token for Keycloak
 */
async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const authProvider = getAuthProvider();
      if (authProvider === 'keycloak') {
        // For Keycloak, we need to access the instance and refresh
        // This would need to be implemented based on your Keycloak setup
        console.warn('Keycloak token refresh not implemented yet');
        return null;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Make an API request with proper error handling (throws on error)
 */
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  retryCount = 0
): Promise<T> {
  const url = getApiUrl(endpoint);
  
  // Get authentication token
  const token = await getToken();
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add Authorization header if token is available
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData: any = null;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use the status text
      }
      
      // Handle 401 with token refresh and retry
      if (response.status === 401 && retryCount === 0) {
        console.log('Received 401, attempting token refresh...');
        try {
          const newToken = await refreshToken();
          
          if (newToken) {
            console.log('Token refreshed, retrying request...');
            // Retry the request with the new token
            return apiRequest(method, endpoint, data, retryCount + 1);
          } else {
            console.warn('Token refresh failed, returning 401 error');
          }
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
        }
      }
      
      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors or other issues
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error - please check your connection', 0);
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

/**
 * Make an API request that returns Result types instead of throwing
 */
export async function safeApiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  retryCount = 0
): Promise<ApiResult<T>> {
  try {
    const result = await apiRequest<T>(method, endpoint, data, retryCount);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      return { 
        success: false, 
        error: { 
          status: error.status, 
          code: error.name, 
          message: error.message 
        } 
      };
    }
    return { 
      success: false, 
      error: { 
        status: 0, 
        code: 'UnknownError', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      } 
    };
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>('GET', endpoint),
  post: <T = any>(endpoint: string, data?: any) => apiRequest<T>('POST', endpoint, data),
  put: <T = any>(endpoint: string, data?: any) => apiRequest<T>('PUT', endpoint, data),
  patch: <T = any>(endpoint: string, data?: any) => apiRequest<T>('PATCH', endpoint, data),
  delete: <T = any>(endpoint: string) => apiRequest<T>('DELETE', endpoint),
};

export const safeApi = {
  get: <T = any>(endpoint: string) => safeApiRequest<T>('GET', endpoint),
  post: <T = any>(endpoint: string, data?: any) => safeApiRequest<T>('POST', endpoint, data),
  put: <T = any>(endpoint: string, data?: any) => safeApiRequest<T>('PUT', endpoint, data),
  patch: <T = any>(endpoint: string, data?: any) => safeApiRequest<T>('PATCH', endpoint, data),
  delete: <T = any>(endpoint: string) => safeApiRequest<T>('DELETE', endpoint),
};

// RSVP-specific API methods
export const rsvpApi = {
  get: (sessionId: number): Promise<ApiResult<{
    sessionId: number;
    counts: { going: number; maybe: number; no: number };
    byPlayer: Array<{ playerId: number; playerName: string; status: string; comment?: string }>;
  }>> => safeApi.get(endpoints.rsvps.get(sessionId)),
  
  upsert: (data: {
    sessionId: number;
    playerId: number;
    status: 'going' | 'maybe' | 'no';
    comment?: string;
  }): Promise<ApiResult<{
    id: number;
    sessionId: number;
    playerId: number;
    parentUserId: number;
    status: string;
    comment?: string;
    updatedAt: string;
  }>> => safeApi.post(endpoints.rsvps.create(), data),
};

/**
 * API endpoints for the three main flows
 */
export const endpoints = {
  // Players
  players: {
    list: () => '/players',
    create: () => '/players',
    get: (id: number) => `/players/${id}`,
    update: (id: number) => `/players/${id}`,
    delete: (id: number) => `/players/${id}`,
  },
  
  // Sessions
  sessions: {
    list: () => '/sessions',
    create: () => '/sessions',
    get: (id: number) => `/sessions/${id}`,
    update: (id: number) => `/sessions/${id}`,
    delete: (id: number) => `/sessions/${id}`,
    today: () => '/sessions/today',
    upcoming: () => '/sessions/upcoming',
    all: () => '/sessions/all',
  },
  
  // Payments
  payments: {
    list: () => '/payments',
    create: () => '/payments',
    get: (id: number) => `/payments/${id}`,
    update: (id: number) => `/payments/${id}`,
    delete: (id: number) => `/payments/${id}`,
    pending: () => '/payments/pending',
    remind: (id: number) => `/payments/${id}/remind`,
  },
  
  // Admin
  admin: {
    users: () => '/admin/users',
    stats: () => '/admin/stats',
    announcements: () => '/admin/announcements',
    sessions: () => '/admin/sessions',
  },
  
  // RSVP
  rsvps: {
    get: (sessionId: number) => `/rsvps?sessionId=${sessionId}`,
    create: () => '/rsvps',
    update: () => '/rsvps',
  },
} as const;
