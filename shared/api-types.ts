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
  | 'Forbidden'
  | 'AccountLocked'
  | 'AccountDisabled'
  | 'TooManyAttempts'
  | 'SessionExpired'
  | 'AuthorizationRequired';

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

/**
 * Auth related response types
 */
export interface AuthResponse {
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    isVerified: boolean;
    academyId?: number;
    academyName?: string;
  };
  token?: string;
}

/**
 * Player related response types
 */
export interface PlayerResponse {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageGroup: string;
  parentId: number;
  parentName: string;
  parentEmail: string;
  academyId: number;
  academyName: string;
}

/**
 * Session related response types
 */
export interface SessionResponse {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  coachId: number;
  coachName: string;
  academyId: number;
  ageGroup: string;
}

/**
 * Announcement related response types
 */
export interface AnnouncementResponse {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  createdById: number;
  createdByName: string;
  academyId: number;
  isPinned: boolean;
  isPublic: boolean;
}

/**
 * Payment related response types
 */
export interface PaymentResponse {
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  playerId: number;
  playerName: string;
  parentId: number;
  parentName: string;
  academyId: number;
  date: string;
  notes?: string;
  paymentMethod?: string;
  refNumber?: string;
}

/**
 * Connection request related response types
 */
export interface ConnectionRequestResponse {
  id: number;
  playerId: number;
  playerFirstName: string;
  playerLastName: string;
  parentId: number;
  parentName: string;
  parentEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  academyId: number;
}