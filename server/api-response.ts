import { Response } from 'express';
import { ApiErrorType, ApiResponse } from '@shared/api-types';

/**
 * Send a standardized success response
 * @param res Express response object
 * @param message Success message to display
 * @param data Optional data to include in the response
 * @param status HTTP status code
 */
export function sendSuccess<T = any>(
  res: Response,
  message: string,
  data?: T,
  status: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data: data as T
  };
  res.status(status).json(response);
}

/**
 * Send a standardized error response
 * @param res Express response object
 * @param message Error message to display
 * @param error Error type
 * @param status HTTP status code
 * @param details Additional error details
 * @param fields Field names with validation errors
 */
export function sendError(
  res: Response,
  message: string,
  error?: ApiErrorType | string,
  status: number = 400,
  details?: string,
  fields?: string[]
): void {
  const response: ApiResponse = {
    success: false,
    message,
    error,
    details,
    fields
  };
  res.status(status).json(response);
}

/**
 * Helper function to send validation errors
 * @param res Express response object
 * @param message Error message
 * @param fields Field names with validation errors
 */
export function sendValidationError(
  res: Response,
  message: string = 'Validation error',
  fields?: string[]
): void {
  sendError(res, message, 'InvalidInputFormat', 400, 'One or more fields failed validation', fields);
}

/**
 * Helper function to send username already exists error
 * @param res Express response object
 * @param message Error message
 */
export function sendUsernameExistsError(
  res: Response,
  message: string = 'Username already exists'
): void {
  sendError(res, message, 'UsernameAlreadyExists', 400, 'A user with this username already exists');
}

/**
 * Helper function to send email already registered error
 * @param res Express response object
 * @param message Error message
 */
export function sendEmailExistsError(
  res: Response,
  message: string = 'Email already registered'
): void {
  sendError(res, message, 'EmailAlreadyRegistered', 400, 'A user with this email already exists');
}

/**
 * Helper function to send database error
 * @param res Express response object
 * @param message Error message
 * @param details Error details
 */
export function sendDatabaseError(
  res: Response,
  message: string = 'Database error',
  details?: string
): void {
  sendError(res, message, 'DatabaseError', 500, details);
}

/**
 * Helper function to send email send failure error
 * @param res Express response object
 * @param message Error message
 * @param details Error details
 */
export function sendEmailSendError(
  res: Response,
  message: string = 'Failed to send email',
  details?: string
): void {
  sendError(res, message, 'EmailSendFailure', 500, details);
}

/**
 * Helper function to send invalid credentials error
 * @param res Express response object
 * @param message Error message
 */
export function sendInvalidCredentialsError(
  res: Response,
  message: string = 'Invalid username or password'
): void {
  sendError(res, message, 'InvalidCredentials', 401);
}

/**
 * Helper function to send user not verified error
 * @param res Express response object
 * @param message Error message
 */
export function sendUserNotVerifiedError(
  res: Response,
  message: string = 'User account not verified'
): void {
  sendError(res, message, 'UserNotVerified', 403, 'Please verify your email before logging in');
}

/**
 * Helper function to send duplicate request error
 * @param res Express response object
 * @param message Error message
 */
export function sendDuplicateRequestError(
  res: Response,
  message: string = 'Duplicate request'
): void {
  sendError(res, message, 'DuplicateRequest', 409, 'This request has already been processed');
}

/**
 * Helper function to send not found error
 * @param res Express response object
 * @param message Error message
 * @param resourceType Type of resource not found
 */
export function sendNotFoundError(
  res: Response,
  message: string = 'Resource not found',
  resourceType?: string
): void {
  sendError(
    res,
    message,
    'NotFound',
    404,
    resourceType ? `The requested ${resourceType} was not found` : undefined
  );
}

/**
 * Helper function to send unauthorized error
 * @param res Express response object
 * @param message Error message
 */
export function sendUnauthorizedError(
  res: Response,
  message: string = 'Unauthorized'
): void {
  sendError(res, message, 'Unauthorized', 401, 'Authentication required');
}

/**
 * Helper function to send forbidden error
 * @param res Express response object
 * @param message Error message
 */
export function sendForbiddenError(
  res: Response,
  message: string = 'Access denied'
): void {
  sendError(res, message, 'Forbidden', 403, 'You do not have permission to access this resource');
}

/**
 * Helper function to send account locked error
 * @param res Express response object
 * @param message Error message
 */
export function sendAccountLockedError(
  res: Response,
  message: string = 'Account locked'
): void {
  sendError(res, message, 'AccountLocked', 403, 'Your account has been temporarily locked due to too many failed attempts');
}

/**
 * Helper function to send account disabled error
 * @param res Express response object
 * @param message Error message
 */
export function sendAccountDisabledError(
  res: Response,
  message: string = 'Account disabled'
): void {
  sendError(res, message, 'AccountDisabled', 403, 'Your account has been disabled');
}

/**
 * Helper function to send too many attempts error
 * @param res Express response object
 * @param message Error message
 */
export function sendTooManyAttemptsError(
  res: Response,
  message: string = 'Too many attempts'
): void {
  sendError(res, message, 'TooManyAttempts', 429, 'Too many attempts. Please try again later');
}

/**
 * Helper function to send session expired error
 * @param res Express response object
 * @param message Error message
 */
export function sendSessionExpiredError(
  res: Response,
  message: string = 'Session expired'
): void {
  sendError(res, message, 'SessionExpired', 401, 'Your session has expired. Please log in again');
}

/**
 * Helper function to send authorization required error
 * @param res Express response object
 * @param message Error message
 */
export function sendAuthorizationRequiredError(
  res: Response,
  message: string = 'Authorization required'
): void {
  sendError(res, message, 'AuthorizationRequired', 401, 'This action requires authorization');
}