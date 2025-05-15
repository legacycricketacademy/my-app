/**
 * Standardized API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiErrorType;
}

/**
 * Error types for registration and account-related issues
 */
export type ApiErrorType = 
  | 'UsernameAlreadyExists'
  | 'EmailAlreadyRegistered'
  | 'EmailSendFailed'
  | 'InvalidInputFormat'
  | 'DatabaseUnavailable'
  | 'PasswordTooWeak'
  | 'AccountCreateFailed'
  | 'UnknownError'
  | 'FirebaseAuthError'
  | 'NetworkError';

/**
 * Username availability response
 */
export interface UsernameAvailabilityResponse {
  available: boolean;
  username: string;
  suggestions?: string[];
}

/**
 * Registration response with user data
 */
export interface RegistrationResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    createdAt: string;
  };
  emailSent: boolean;
  verificationNeeded: boolean;
}