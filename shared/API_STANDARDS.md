# API Communication Standards

This document outlines our API communication standards to ensure consistent client-server interaction.

## Core Principles

1. **Standardized Format:** All API responses use a standard envelope format
2. **Error Handling:** Consistent error reporting across all endpoints
3. **Type Safety:** Type interfaces for both requests and responses
4. **Backward Compatibility:** Additions to the response format must be backward compatible

## Standard Response Format

All API responses follow this standard format:

```typescript
{
  success: boolean,        // Whether the request was successful
  message: string,         // Human-readable message (success or error)
  data?: any,              // Optional response data
  code?: string,           // Optional error/success code for programmatic handling
  status?: number,         // HTTP status code
  timestamp?: string,      // Response timestamp
  // Additional metadata fields as needed
}
```

## Authentication Response Format

Authentication-related endpoints use this extended format:

```typescript
{
  success: boolean,
  message: string,
  data: {
    user: User,                      // User data
    emailSent?: boolean,             // Whether a verification email was sent
    verificationLink?: string,       // Optional verification link (testing only)
    emailStatus?: 'sent' | 'failed' | 'pending',
    isVerified?: boolean,            // Whether the user's email is verified
    tokenExpires?: number            // Optional token expiration time
  },
  // Standard fields...
}
```

## HTTP Status Codes

- **2xx**: Successful responses
  - 200: OK - The request was successful
  - 201: Created - A new resource was created
  - 204: No Content - Success with no response body

- **4xx**: Client errors
  - 400: Bad Request - Validation errors or malformed request
  - 401: Unauthorized - Authentication required
  - 403: Forbidden - Authenticated but not authorized
  - 404: Not Found - Resource not found
  - 422: Unprocessable Entity - Request validation failed

- **5xx**: Server errors
  - 500: Internal Server Error - An unexpected error occurred
  - 503: Service Unavailable - The service is temporarily unavailable

## Error Codes

Error codes follow a `resource_operation_issue` format:

- `auth_login_failed`: Authentication login failed
- `auth_registration_failed`: User registration failed
- `validation_error`: Request validation failed
- `not_found`: Resource not found
- `server_error`: Generic server error
- `forbidden`: Access denied

## Usage on the Backend

Use the utility functions to create standardized responses:

```typescript
import { createSuccessResponse, createErrorResponse } from '../utils/api-response';

// Success response
res.status(200).json(createSuccessResponse(
  data,
  "Operation successful"
));

// Error response
res.status(400).json(createErrorResponse(
  "Validation failed",
  "validation_error",
  400,
  validationErrors
));
```

## Usage on the Frontend

Use the API client to make requests:

```typescript
import { get, post } from '../lib/api-client';
import { ApiResponse, AuthResponse } from '@shared/api-types';

// Making a request
const response = await post<AuthResponse>('/api/login', { username, password });

// Accessing the response data
if (response.success) {
  const user = response.data.user;
  // Use the user data
}
```

## Benefits

1. **Consistency:** All API endpoints behave predictably
2. **Documentation:** Clear expectations for client-server communication
3. **Type Safety:** Typescript interfaces prevent mismatches
4. **Error Handling:** Standardized error format makes debugging easier
5. **Maintenance:** Easier to update and extend the API

## Implementation

- Backend: `server/utils/api-response.ts` - Utility functions for creating standardized responses
- Frontend: `client/src/lib/api-client.ts` - API client for making requests
- Shared: `shared/api-types.ts` - Type definitions for requests and responses