/**
 * Shared API response types for both frontend and backend
 */

/**
 * Common error types that can be returned from the API
 */
export type ApiErrorType = 
  | 'InvalidInputFormat'
  | 'UsernameAlreadyExists'
  | 'EmailAlreadyRegistered'
  | 'DatabaseError'
  | 'EmailSendFailure'
  | 'InvalidCredentials'
  | 'UserNotVerified'
  | 'DuplicateRequest'
  | 'NotFound'
  | 'Unauthorized'
  | 'Forbidden';

/**
 * Base success response structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

/**
 * Base error response structure
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: ApiErrorType | string;
  details?: string;
  errorCode?: string;
  fields?: string[];
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Helper to extract the data type from a success response
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Helper to check if a response is an error
 */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Helper to check for specific error types
 */
export function hasApiErrorType(response: ApiResponse, errorType: ApiErrorType): boolean {
  return isApiError(response) && response.error === errorType;
}