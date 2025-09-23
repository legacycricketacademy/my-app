import { getToken, refreshToken } from './auth';

const API_BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    message: string, 
    public status?: number,
    public code?: string,
    public payload?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  method: string, 
  endpoint: string, 
  data?: any, 
  retryCount: number = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    // Get auth token
    const token = getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    // Add body for POST/PUT requests
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);

    // Handle 401 with token refresh
    if (response.status === 401 && token && retryCount === 0) {
      try {
        const refreshedToken = refreshToken();
        if (refreshedToken && refreshedToken !== token) {
          // Retry with refreshed token
          return apiRequest<T>(method, endpoint, data, retryCount + 1);
        } else {
          // No refreshed token available
          throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
      } catch (error) {
        // Refresh failed, throw UNAUTHORIZED
        throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      }
    }

    if (!response.ok) {
      let errorPayload;
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = await response.text();
      }
      
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        `HTTP_${response.status}`,
        errorPayload
      );
    }

    return response.json();
  } catch (error) {
    // Wrap network errors and other fetch errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error', undefined, 'NETWORK_ERROR', error.message);
    }
    
    throw new ApiError('Request failed', undefined, 'UNKNOWN_ERROR', error);
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, data: any) => 
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: any) => 
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, {
      method: 'DELETE',
    }),
};