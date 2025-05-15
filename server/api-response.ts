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