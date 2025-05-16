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

// Default request options
const defaultOptions: ApiRequestOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  timeout: 30000 // 30 seconds timeout
};

/**
 * Makes an API request with standardized error handling and response processing
 * @param method HTTP method
 * @param url API endpoint URL
 * @param data Request body
 * @param options Request options
 * @returns Promise that resolves to the API response
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

    // Make the request
    const response = await fetch(url, requestOptions);

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

    // Handle abort errors (timeouts)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout', {
        code: 'timeout',
        status: 408,
      });
    }

    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      { code: 'network_error' }
    );
  }
}

/**
 * Convenience method for GET requests
 */
export function get<T = any>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
  return apiRequest<T>('GET', url, undefined, options);
}

/**
 * Convenience method for POST requests
 */
export function post<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
  return apiRequest<T>('POST', url, data, options);
}

/**
 * Convenience method for PUT requests
 */
export function put<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
  return apiRequest<T>('PUT', url, data, options);
}

/**
 * Convenience method for PATCH requests
 */
export function patch<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
  return apiRequest<T>('PATCH', url, data, options);
}

/**
 * Convenience method for DELETE requests
 */
export function del<T = any>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
  return apiRequest<T>('DELETE', url, undefined, options);
}

/**
 * Updates the React Query cache with new data
 * @param queryKey Query key to update
 * @param data New data
 */
export function updateCache<T = any>(queryKey: string | unknown[], data: T): void {
  queryClient.setQueryData(queryKey, data);
}

/**
 * Invalidates a query in the React Query cache
 * @param queryKey Query key to invalidate
 */
export function invalidateQuery(queryKey: string | unknown[]): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
}