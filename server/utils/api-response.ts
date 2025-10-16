// server/utils/api-response.ts
//
// Utility functions for creating standardized API responses
// This ensures a consistent format for all API responses from the backend

import { ApiResponse } from '../../shared/api-types';

/**
 * Creates a success response with the standardized format
 * @param data Optional data to include in the response
 * @param message Success message
 * @param metadata Additional metadata to include in the response
 * @returns Standardized success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message: string = 'Success',
  metadata: Record<string, any> = {}
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    ...metadata
  };
}

/**
 * Creates an error response with the standardized format
 * @param message Error message
 * @param code Optional error code
 * @param status HTTP status code
 * @param data Optional data to include in the response
 * @returns Standardized error response
 */
export function createErrorResponse<T = any>(
  message: string = 'An error occurred',
  errorCode?: string,
  details?: string
): ApiResponse<T> {
  return {
    success: false,
    message,
    errorCode,
    details
  };
}

/**
 * Creates an authentication response with user data and optional metadata
 * @param user User data
 * @param message Success message
 * @param metadata Additional metadata to include in the response
 * @returns Standardized authentication response
 */
export function createAuthResponse<T = any>(
  user: T,
  message: string = 'Authentication successful',
  metadata: Record<string, any> = {}
): ApiResponse<T> {
  return createSuccessResponse(
    user,
    message,
    metadata
  );
}

/**
 * Creates a validation error response
 * @param errors Validation errors
 * @param message Error message
 * @returns Standardized validation error response
 */
export function createValidationErrorResponse(
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
): ApiResponse {
  return createErrorResponse(
    message,
    'validation_error',
    JSON.stringify({ errors })
  );
}

/**
 * Creates an unauthorized error response
 * @param message Error message
 * @returns Standardized unauthorized error response
 */
export function createUnauthorizedResponse(
  message: string = 'Unauthorized'
): ApiResponse {
  return createErrorResponse(
    message,
    'unauthorized'
  );
}

/**
 * Creates a forbidden error response
 * @param message Error message
 * @returns Standardized forbidden error response
 */
export function createForbiddenResponse(
  message: string = 'Forbidden'
): ApiResponse {
  return createErrorResponse(
    message,
    'forbidden'
  );
}

/**
 * Creates a not found error response
 * @param message Error message
 * @returns Standardized not found error response
 */
export function createNotFoundResponse(
  message: string = 'Not found'
): ApiResponse {
  return createErrorResponse(
    message,
    'not_found'
  );
}