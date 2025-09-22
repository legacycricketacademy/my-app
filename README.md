# Legacy Cricket Academy

A comprehensive cricket academy management system with multi-provider authentication support.

## Features

- **Multi-Provider Authentication**: Support for Keycloak, Firebase, and Mock authentication
- **Role-Based Access Control**: Parent and Admin roles with route protection
- **Player Management**: Add, edit, and manage player profiles
- **Session Scheduling**: Create and manage training sessions
- **Payment Tracking**: Monitor payments and send reminders
- **Email Notifications**: SendGrid integration for automated emails
- **Responsive UI**: Modern, accessible interface built with React and Tailwind CSS

## Authentication Providers

The application supports three authentication providers:

### 1. Mock Authentication (Development)
- **Provider**: `VITE_AUTH_PROVIDER=mock`
- **Test Accounts**:
  - Parent: `parent@test.com` / `Test1234!`
  - Admin: `admin@test.com` / `Test1234!`

### 2. Keycloak Authentication
- **Provider**: `VITE_AUTH_PROVIDER=keycloak`
- **Configuration**:
  ```bash
  VITE_KEYCLOAK_URL=https://your-keycloak-instance.com
  VITE_KEYCLOAK_REALM=cricket-academy
  VITE_KEYCLOAK_CLIENT_ID=cricket-coaching-spa
  ```
- **Features**:
  - Standard OAuth2 flow with PKCE
  - Role mapping from Keycloak roles
  - Automatic token refresh
  - Silent SSO check

### 3. Firebase Authentication
- **Provider**: `VITE_AUTH_PROVIDER=firebase`
- **Configuration**:
  ```bash
  VITE_FIREBASE_API_KEY=your_firebase_api_key
  VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
  VITE_FIREBASE_APP_ID=your_firebase_app_id
  ```

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   # Copy the example environment file
   cp ENVIRONMENT_VARIABLES.md .env
   
   # Edit .env with your configuration
   VITE_AUTH_PROVIDER=mock  # or keycloak, firebase
   DATABASE_URL="postgresql://localhost:5432/cricket_academy"
   PORT=3000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open http://localhost:3000
   - Sign in with test credentials (if using mock auth)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run all tests
- `npm run test:api` - Run API tests only
- `npm run test:e2e` - Run E2E tests

### Testing

The application includes comprehensive testing:

- **API Tests**: Using Vitest and Supertest
- **E2E Tests**: Using Playwright
- **Test Coverage**: Players, Sessions, Payments, Authentication

Run tests:
```bash
# All tests
npm run test

# API tests only
npm run test:api

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## Keycloak Setup

To use Keycloak authentication:

1. **Install Keycloak**
   ```bash
   # Using Docker
   docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
   ```

2. **Create Realm and Client**
   - Create a new realm: `cricket-academy`
   - Create a client: `cricket-coaching-spa`
   - Set client type to "OpenID Connect"
   - Set access type to "public"
   - Enable "Standard Flow" and "Direct Access Grants"
   - Set valid redirect URIs: `http://localhost:3000/*`

3. **Create Users and Roles**
   - Create roles: `parent`, `admin`
   - Create users and assign roles
   - Set user passwords

4. **Configure Environment**
   ```bash
   VITE_AUTH_PROVIDER=keycloak
   VITE_KEYCLOAK_URL=http://localhost:8080
   VITE_KEYCLOAK_REALM=cricket-academy
   VITE_KEYCLOAK_CLIENT_ID=cricket-coaching-spa
   ```

## Testing with cURL

### Getting an Access Token

1. **Get Keycloak Token Endpoint**
   ```bash
   # Get token endpoint URL
   curl -s "http://localhost:8080/realms/cricket-academy/.well-known/openid_configuration" | jq -r '.token_endpoint'
   ```

2. **Get Access Token**
   ```bash
   # Replace with your actual credentials
   curl -X POST "http://localhost:8080/realms/cricket-academy/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=password" \
     -d "client_id=cricket-coaching-spa" \
     -d "username=your-username" \
     -d "password=your-password"
   ```

3. **Extract Access Token**
   ```bash
   # Save the response and extract the access_token
   ACCESS_TOKEN="your-access-token-here"
   ```

### Testing API Endpoints

**Public Endpoints (No Auth Required):**
```bash
# Health check
curl http://localhost:3000/api/ping

# Get players (read-only)
curl http://localhost:3000/api/players

# Get sessions (read-only)
curl http://localhost:3000/api/sessions
```

**Protected Endpoints (Auth Required):**
```bash
# Create a player
curl -X POST http://localhost:3000/api/players \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Player",
    "dateOfBirth": "2010-01-01",
    "ageGroup": "Under 12s",
    "parentEmail": "test@example.com",
    "parentName": "Test Parent"
  }'

# Create a session
curl -X POST http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Session",
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-01-01T12:00:00Z",
    "location": "Test Field",
    "ageGroup": "Under 12s",
    "sessionType": "Training",
    "maxAttendees": 20
  }'
```

**Admin-Only Endpoints:**
```bash
# Get admin stats (requires admin role)
curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/api/admin/stats

# Get all users (requires admin role)
curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/api/admin/users

# Create announcement (requires admin role)
curl -X POST http://localhost:3000/api/admin/announcements \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Notice",
    "message": "Training session cancelled due to weather",
    "priority": "high"
  }'
```

### Testing Authentication Errors

**Missing Token:**
```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Test"}'
# Returns: 401 Unauthorized
```

**Invalid Token:**
```bash
curl -X POST http://localhost:3000/api/players \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Test"}'
# Returns: 401 Unauthorized
```

**Insufficient Role:**
```bash
# Using a parent token to access admin endpoint
curl -H "Authorization: Bearer $PARENT_TOKEN" http://localhost:3000/api/admin/stats
# Returns: 403 Forbidden
```

## Email Configuration

The application supports SendGrid for email notifications:

```bash
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@legacycricketacademy.com
EMAIL_REPLY_TO=support@legacycricketacademy.com
```

If `SENDGRID_API_KEY` is not set, emails will be logged to the console instead of being sent.

## API Endpoints

- `GET /api/ping` - Health check
- `GET /api/players` - List players
- `POST /api/players` - Create player
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `POST /api/payments/:id/remind` - Send payment reminder

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: Keycloak/Firebase/Mock
- **Email**: SendGrid
- **Testing**: Vitest + Playwright
- **Styling**: Tailwind CSS + shadcn/ui

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details
