import { Response } from 'express';

/**
 * Standard success response
 * @param res Express Response object
 * @param message User-friendly success message
 * @param data Optional data to include in the response
 */
export function sendSuccess(res: Response, message: string, data = {}) {
  return res.status(200).json({ success: true, message, data });
}

/**
 * Standard error response
 * @param res Express Response object
 * @param message User-friendly error message
 * @param code HTTP status code
 * @param errorType Optional error type identifier
 * @param details Optional technical details (not shown to users)
 * @param errorCode Optional error code for client-side handling
 */
export function sendError(
  res: Response, 
  message = 'An error occurred', 
  code = 500, 
  errorType?: string,
  details?: string,
  errorCode?: string
) {
  const response: any = { success: false, message };
  
  if (errorType) response.error = errorType;
  if (details) response.details = details;
  if (errorCode) response.errorCode = errorCode;
  
  return res.status(code).json(response);
}

/**
 * Validation error response
 * @param res Express Response object
 * @param message User-friendly validation error message
 * @param fields Array of field names that failed validation
 */
export function sendValidationError(res: Response, message: string, fields: string[] = []) {
  return res.status(400).json({ 
    success: false, 
    message, 
    error: 'InvalidInputFormat', 
    fields 
  });
}

/**
 * Username already exists error
 * @param res Express Response object
 * @param username The username that was already taken
 */
export function sendUsernameExistsError(res: Response, username: string) {
  return res.status(409).json({
    success: false,
    message: `The username '${username}' is already taken.`,
    error: 'UsernameAlreadyExists'
  });
}

/**
 * Email already registered error
 * @param res Express Response object
 * @param email The email that was already registered
 */
export function sendEmailExistsError(res: Response, email: string) {
  return res.status(409).json({
    success: false,
    message: `The email '${email}' is already registered.`,
    error: 'EmailAlreadyRegistered'
  });
}

/**
 * Database error response
 * @param res Express Response object
 * @param details Technical details about the database error
 */
export function sendDatabaseError(res: Response, details?: string) {
  return sendError(
    res,
    'Database operation failed. Please try again later.',
    503,
    'DatabaseError',
    details
  );
}

/**
 * Email sending failure response
 * @param res Express Response object
 * @param details Technical details about the email failure
 */
export function sendEmailSendFailure(res: Response, details?: string) {
  return sendError(
    res,
    'Failed to send email. Please try again later.',
    500,
    'EmailSendFailure',
    details
  );
}

/**
 * Invalid credentials error response
 * @param res Express Response object
 */
export function sendInvalidCredentialsError(res: Response) {
  return sendError(
    res,
    'Invalid username or password.',
    401,
    'InvalidCredentials'
  );
}

/**
 * User not verified error response
 * @param res Express Response object
 */
export function sendUserNotVerifiedError(res: Response) {
  return sendError(
    res,
    'Please verify your email address before logging in.',
    403,
    'UserNotVerified'
  );
}