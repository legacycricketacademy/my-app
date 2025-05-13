# API Response Standardization Examples

This document provides examples of how to update existing endpoints to use the new standardized API response format.

## Example 1: User Registration Endpoint

### Before:

```typescript
app.post("/api/register", async (req, res) => {
  try {
    // User creation logic...
    const user = await storage.createUser(userData);
    
    // Send verification email...
    const verificationLink = generateLink();
    const emailSent = await sendEmail(/*...*/);
    
    // Direct user object response
    return res.status(201).json({
      ...user,  // user data directly at the root
      verificationLink: verificationLink,
      emailSent: !!verificationLink
    });
  } catch (error) {
    return res.status(500).json({ 
      message: "Error creating account",
      error: error.message
    });
  }
});
```

### After:

```typescript
import { createSuccessResponse, createErrorResponse } from './utils/api-response';
import { ApiResponse, AuthResponse } from '../shared/api-types';

app.post("/api/register", async (req, res) => {
  try {
    // User creation logic...
    const user = await storage.createUser(userData);
    
    // Send verification email...
    const verificationLink = generateLink();
    const emailSent = await sendEmail(/*...*/);
    
    // Standardized response format
    const response: ApiResponse<AuthResponse> = createSuccessResponse(
      {
        user,
        emailSent: !!verificationLink,
        verificationLink
      },
      "User registered successfully"
    );
    
    return res.status(201).json(response);
  } catch (error) {
    const errorResponse = createErrorResponse(
      error.message || "Error creating account",
      error.code || "registration_error",
      500
    );
    
    return res.status(500).json(errorResponse);
  }
});
```

## Example 2: Login Endpoint

### Before:

```typescript
app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json(req.user);
});
```

### After:

```typescript
import { createAuthResponse, createUnauthorizedResponse } from './utils/api-response';

app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json(createErrorResponse(
        "Login failed due to server error",
        "server_error",
        500
      ));
    }
    
    if (!user) {
      return res.status(401).json(createUnauthorizedResponse(
        info.message || "Invalid credentials"
      ));
    }
    
    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json(createErrorResponse(
          "Login session could not be established",
          "session_error",
          500
        ));
      }
      
      return res.status(200).json(createAuthResponse(
        user,
        "Login successful"
      ));
    });
  })(req, res, next);
});
```

## Example 3: Error Handling

### Before:

```typescript
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: err.message
  });
});
```

### After:

```typescript
import { createErrorResponse } from './utils/api-response';

app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  const statusCode = err.status || 500;
  const errorCode = err.code || "server_error";
  
  res.status(statusCode).json(createErrorResponse(
    err.message || "Internal server error",
    errorCode,
    statusCode
  ));
});
```

## Example 4: Handling Successful Resource Retrieval

### Before:

```typescript
app.get("/api/players", async (req, res) => {
  try {
    const players = await storage.getAllPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### After:

```typescript
import { createSuccessResponse, createErrorResponse } from './utils/api-response';

app.get("/api/players", async (req, res) => {
  try {
    const players = await storage.getAllPlayers();
    
    res.json(createSuccessResponse(
      players,
      "Players retrieved successfully"
    ));
  } catch (error) {
    res.status(500).json(createErrorResponse(
      "Failed to retrieve players",
      "retrieval_error",
      500
    ));
  }
});
```

## Client-Side Usage Example

```typescript
import { get, post } from '../lib/api-client';
import { ApiResponse, AuthResponse } from '@shared/api-types';

// Using the API client
async function loginUser(username: string, password: string) {
  try {
    const response = await post<AuthResponse>('/api/login', { username, password });
    
    // Access data with proper typing
    const user = response.data.user;
    return user;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

// Using in a React component with React Query
function UserProfile() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await get<AuthResponse>('/api/user');
      return response.data.user;
    }
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome, {data.fullName}</h1>
      {/* Rest of component */}
    </div>
  );
}
```