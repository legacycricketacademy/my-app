import { Response } from 'express';

// Define the API error types
export type ApiErrorType = 
  | 'UsernameAlreadyExists'
  | 'EmailAlreadyExists'
  | 'DatabaseError'
  | 'EmailSendFailure'
  | 'ValidationError'
  | 'InvalidCredentials'
  | 'UserNotVerified'
  | 'AccountLocked'
  | 'AccountDisabled'
  | 'TooManyAttempts'
  | 'SessionExpired'
  | 'AuthorizationRequired'
  | 'DuplicateRequest'
  | 'UnknownError';

// Define the standard API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiErrorType;
  code?: string;
  details?: string;
}

/**
 * Standard success response
 */
export function sendSuccess<T>(res: Response, message: string, data?: T): void {
  const response: ApiResponse<T> = {
    success: true,
    message
  };
  
  if (data !== undefined) {
    response.data = data;
  }
  
  res.status(200).json(response);
}

/**
 * Standard error response with typed error
 */
export function sendError(
  res: Response, 
  message: string, 
  statusCode: number = 400,
  errorType: ApiErrorType = 'UnknownError',
  details?: string,
  code?: string
): void {
  const response: ApiResponse = {
    success: false,
    message,
    error: errorType
  };
  
  if (details) {
    response.details = details;
  }
  
  if (code) {
    response.code = code;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Helper for username already exists error
 */
export function sendUsernameExistsError(res: Response, username: string): void {
  sendError(
    res,
    `This username is already taken`,
    409,
    'UsernameAlreadyExists',
    `Username '${username}' is already registered`,
    'USERNAME_EXISTS'
  );
}

/**
 * Helper for email already registered error
 */
export function sendEmailExistsError(res: Response, email: string): void {
  sendError(
    res,
    `This email address is already registered`,
    409,
    'EmailAlreadyExists',
    `Email '${email}' is already in use`,
    'EMAIL_EXISTS'
  );
}

/**
 * Helper for database unavailable error
 */
export function sendDatabaseError(res: Response, details?: string): void {
  sendError(
    res,
    `Database operation failed`,
    500,
    'DatabaseError',
    details,
    'DATABASE_ERROR'
  );
}

/**
 * Helper for email sending failure
 */
export function sendEmailSendFailure(res: Response, accountCreated: boolean = true): void {
  sendError(
    res,
    accountCreated 
      ? `Account created, but verification email could not be sent` 
      : `Email could not be sent`,
    500,
    'EmailSendFailure',
    'Email service unavailable or configuration error',
    'EMAIL_SEND_FAILURE'
  );
}

/**
 * Helper for validation errors
 */
export function sendValidationError(res: Response, details: string): void {
  sendError(
    res,
    `Validation failed`,
    400,
    'ValidationError',
    details,
    'VALIDATION_ERROR'
  );
}

/**
 * Helper for invalid credentials error
 */
export function sendInvalidCredentialsError(res: Response): void {
  sendError(
    res,
    `Invalid username or password`,
    401,
    'InvalidCredentials',
    'The provided credentials do not match our records',
    'INVALID_CREDENTIALS'
  );
}

/**
 * Helper for unverified user error
 */
export function sendUserNotVerifiedError(res: Response, email?: string): void {
  sendError(
    res,
    `Please verify your email before logging in`,
    403,
    'UserNotVerified',
    email ? `Email '${email}' requires verification` : 'Email verification required',
    'USER_NOT_VERIFIED'
  );
}

/**
 * Helper for locked account error
 */
export function sendAccountLockedError(res: Response, minutesRemaining?: number): void {
  sendError(
    res,
    minutesRemaining
      ? `Account locked. Try again in ${minutesRemaining} minutes`
      : `Account has been locked for security reasons`,
    403,
    'AccountLocked',
    'Too many failed login attempts',
    'ACCOUNT_LOCKED'
  );
}

/**
 * Helper for disabled account error
 */
export function sendAccountDisabledError(res: Response): void {
  sendError(
    res,
    `This account has been disabled`,
    403,
    'AccountDisabled',
    'Account disabled by administrator',
    'ACCOUNT_DISABLED'
  );
}

/**
 * Helper for too many login attempts error
 */
export function sendTooManyAttemptsError(res: Response): void {
  sendError(
    res,
    `Too many login attempts. Please try again later`,
    429,
    'TooManyAttempts',
    'Rate limit exceeded for login attempts',
    'TOO_MANY_ATTEMPTS'
  );
}

/**
 * Helper for session expired error
 */
export function sendSessionExpiredError(res: Response): void {
  sendError(
    res,
    `Your session has expired`,
    401,
    'SessionExpired',
    'Please log in again to continue',
    'SESSION_EXPIRED'
  );
}

/**
 * Helper for authorization required error
 */
export function sendAuthorizationRequiredError(res: Response): void {
  sendError(
    res,
    `Authorization required`,
    401,
    'AuthorizationRequired',
    'You must be logged in to access this resource',
    'AUTHORIZATION_REQUIRED'
  );
}

/**
 * Helper for duplicate request error
 */
export function sendDuplicateRequestError(res: Response, requestId?: string): void {
  sendError(
    res,
    `This request has already been processed`,
    409,
    'DuplicateRequest',
    requestId ? `Request with ID '${requestId}' was already processed` : 'Duplicate request detected',
    'DUPLICATE_REQUEST'
  );
}