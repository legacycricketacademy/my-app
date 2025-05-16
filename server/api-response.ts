import { Response } from 'express';
import { ApiErrorType, ApiResponse } from '@shared/api-types';

/**
 * Standard success response
 */
export function sendSuccess<T>(res: Response, message: string, data?: T): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };
  
  res.status(200).json(response);
}

/**
 * Standard error response with typed error
 */
export function sendError(
  res: Response, 
  message: string, 
  statusCode: number = 400, 
  errorType: ApiErrorType = 'UnknownError'
): void {
  const response: ApiResponse = {
    success: false,
    message,
    error: errorType
  };
  
  res.status(statusCode).json(response);
}

/**
 * Helper for username already exists error
 */
export function sendUsernameExistsError(res: Response, username: string): void {
  sendError(
    res,
    `The username '${username}' is already taken. Please choose another.`,
    409,
    'UsernameAlreadyExists'
  );
}

/**
 * Helper for email already registered error
 */
export function sendEmailExistsError(res: Response, email: string): void {
  sendError(
    res,
    `The email '${email}' is already registered. Please use another email or try to log in.`,
    409,
    'EmailAlreadyRegistered'
  );
}

/**
 * Helper for database unavailable error
 */
export function sendDatabaseError(res: Response, details?: string): void {
  const message = details 
    ? `Database operation failed: ${details}` 
    : 'The database is currently unavailable. Please try again later.';
  
  sendError(res, message, 503, 'DatabaseUnavailable');
}

/**
 * Helper for email sending failure
 */
export function sendEmailSendFailure(res: Response, accountCreated: boolean = true): void {
  const message = accountCreated
    ? 'Your account was created successfully, but we encountered an issue sending the verification email. You can request a new verification email from your profile.'
    : 'Failed to send verification email. Please try again later.';
  
  sendError(res, message, 500, 'EmailSendFailed');
}

/**
 * Helper for validation errors
 */
export function sendValidationError(res: Response, details: string): void {
  sendError(res, `Validation error: ${details}`, 400, 'InvalidInputFormat');
}

/* Login Error Helpers */

/**
 * Helper for invalid credentials error
 */
export function sendInvalidCredentialsError(res: Response): void {
  sendError(
    res,
    'The username or password you entered is incorrect. Please try again.',
    401,
    'InvalidCredentials'
  );
}

/**
 * Helper for unverified user error
 */
export function sendUserNotVerifiedError(res: Response, email?: string): void {
  const message = email 
    ? `Your email (${email}) has not been verified. Please check your inbox or request a new verification email.`
    : 'Your account has not been verified. Please verify your email before signing in.';
  
  sendError(res, message, 403, 'UserNotVerified');
}

/**
 * Helper for locked account error
 */
export function sendAccountLockedError(res: Response, minutesRemaining?: number): void {
  const message = minutesRemaining 
    ? `Your account has been temporarily locked due to too many failed attempts. Please try again in ${minutesRemaining} minutes.`
    : 'Your account has been temporarily locked due to too many failed attempts. Please try again later.';
  
  sendError(res, message, 403, 'AccountLocked');
}

/**
 * Helper for disabled account error
 */
export function sendAccountDisabledError(res: Response): void {
  sendError(
    res,
    'Your account has been disabled. Please contact support for assistance.',
    403,
    'AccountDisabled'
  );
}

/**
 * Helper for too many login attempts error
 */
export function sendTooManyAttemptsError(res: Response): void {
  sendError(
    res,
    'Too many login attempts. Please try again later or reset your password.',
    429,
    'TooManyAttempts'
  );
}

/**
 * Helper for session expired error
 */
export function sendSessionExpiredError(res: Response): void {
  sendError(
    res,
    'Your session has expired. Please sign in again to continue.',
    401,
    'SessionExpired'
  );
}

/**
 * Helper for authorization required error
 */
export function sendAuthorizationRequiredError(res: Response): void {
  sendError(
    res,
    'You must be signed in to access this resource.',
    401,
    'AuthorizationRequired'
  );
}