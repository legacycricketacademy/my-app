/**
 * API wrapper for making HTTP requests to the backend
 * Provides consistent error handling and JSON parsing
 */

import { getToken } from './auth';

const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

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
 * Make an API request with proper error handling
 */
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>('GET', endpoint),
  post: <T = any>(endpoint: string, data?: any) => apiRequest<T>('POST', endpoint, data),
  put: <T = any>(endpoint: string, data?: any) => apiRequest<T>('PUT', endpoint, data),
  patch: <T = any>(endpoint: string, data?: any) => apiRequest<T>('PATCH', endpoint, data),
  delete: <T = any>(endpoint: string) => apiRequest<T>('DELETE', endpoint),
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
  },
} as const;
