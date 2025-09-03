import { API_BASE_URL } from "./api-config";
// client/src/lib/api-client.ts
//
// Standardized API client for making requests to the backend
// Ensures consistent handling of responses and errors

import { ApiResponse, ApiErrorResponse, isApiError } from '@shared/api-types';
import { queryClient } from './queryClient';
import { handleFetchResponse } from './api-helpers';

// Types for request options
export type ApiRequestOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  timeout?: number;
};

// API error class
export class ApiError extends Error {
  status?: number;
  code?: string;
  data?: any;

  constructor(message: string, options?: { status?: number; code?: string; data?: any }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
    this.data = options?.data;
  }
}

// Default options
const defaultOptions: ApiRequestOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  timeout: 30000, // 30 seconds
};

/**
 * Standardized API request function
 * @param method HTTP method
 * @param url API endpoint (relative path)
 * @param data Request body data
 * @param options Additional request options
 * @returns Promise<ApiResponse<T>>
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> {
  const mergedOptions = { ...defaultOptions, ...options };
  const { headers, credentials, timeout } = mergedOptions;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
      credentials,
      signal: controller.signal,
    };

    // Add body if necessary
    if (data && (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD')) {
      requestOptions.body = JSON.stringify(data);
    }

    // Make the request with base URL
    const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);

    // Clear timeout
    clearTimeout(timeoutId);

    // Use the standardized response handler
    const responseData = await handleFetchResponse<T>(response);

    // Handle error responses
    if (isApiError(responseData)) {
      throw new ApiError(responseData.message || 'API request failed', {
        status: response.status,
        code: responseData.error,
        data: responseData
      });
    }

    return responseData;
  } catch (error) {
    // Clear timeout
    clearTimeout(timeoutId);

    // Handle known API errors
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle fetch errors (network, timeout, etc.)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', { code: 'TIMEOUT' });
      }
      
      throw new ApiError(error.message || 'Network error', { code: 'NETWORK_ERROR' });
    }

    // Handle unknown errors
    throw new ApiError('Unknown error occurred', { code: 'UNKNOWN_ERROR' });
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(url: string, options?: ApiRequestOptions) => 
    apiRequest<T>('GET', url, undefined, options),
  
  post: <T>(url: string, data?: any, options?: ApiRequestOptions) => 
    apiRequest<T>('POST', url, data, options),
  
  put: <T>(url: string, data?: any, options?: ApiRequestOptions) => 
    apiRequest<T>('PUT', url, data, options),
  
  patch: <T>(url: string, data?: any, options?: ApiRequestOptions) => 
    apiRequest<T>('PATCH', url, data, options),
  
  delete: <T>(url: string, options?: ApiRequestOptions) => 
    apiRequest<T>('DELETE', url, undefined, options),
};

/**
 * Invalidate queries after mutations
 */
export function invalidateQueries(queryKeys: string[]) {
  queryKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}
