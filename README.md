# Legacy Cricket Academy

A comprehensive cricket academy management system with multi-provider authentication support.

## Features

- **Multi-Provider Authentication**: Support for Keycloak, Firebase, and Mock authentication
- **Role-Based Access Control**: Parent and Admin roles with route protection
- **Player Management**: Add, edit, and manage player profiles
- **Session Scheduling**: Create and manage training sessions
- **Payment Tracking**: Monitor payments and send reminders
- **Email Notifications**: SendGrid integration for automated emails
- **User Account Management**: Comprehensive profile pages with role-specific tabs
- **Email Banner Control**: Configurable email service status banner
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

## Configuration

### Email Banner Control

The email service status banner can be controlled via environment variables:

- **EMAIL_BANNER**: Controls banner visibility (`on` | `off`, default: `off`)
- **VITE_EMAIL_BANNER**: Client-side banner control

When `EMAIL_BANNER=on`:
- Banner only shows for admin users
- Banner only shows when email service is disabled
- Users can dismiss banner with "Don't show again" option
- Dismissal state persists in localStorage

### User Account Management

The application includes comprehensive account management at `/account`:

**For All Users:**
- Profile: Name, email, phone, timezone settings
- Security: Password management (provider-dependent)
- Notifications: Email and SMS preference settings

**For Parents:**
- Children: Manage child profiles and information

**For Admins:**
- Organization: Academy settings and contact information

### Header User Menu

The header includes a user menu with:
- User avatar with initials
- Role badge (Admin/Parent)
- Dropdown menu with Profile, Settings, and Sign out options
- Keyboard navigation support
- Mobile-responsive design

## Testing

This project includes comprehensive testing at multiple levels:

### Test Types

1. **Unit Tests** - Individual function and component testing
2. **API Tests** - Backend API endpoint testing
3. **E2E Tests** - End-to-end user workflow testing
4. **Accessibility Tests** - WCAG compliance testing
5. **Performance Tests** - Load time and performance testing
6. **Smoke Tests** - Basic functionality verification

### Running Tests Locally

#### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

#### Unit and API Tests
```bash
# Run all unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run API tests only
npm run test:api

# Run API tests with coverage
npm run test:api:coverage
```

#### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI (interactive)
npm run test:e2e:ui

# Run specific test categories
npm run test:e2e:admin
npm run test:e2e:parent
npm run test:e2e:scheduling
npm run test:e2e:payments
npm run test:e2e:navigation

# Run comprehensive test suite
npm run test:e2e:comprehensive
```

#### Accessibility Tests
```bash
# Run accessibility tests
npx playwright test e2e/accessibility.spec.ts
```

#### Performance Tests
```bash
# Run performance tests
npx playwright test e2e/performance.spec.ts

# Run staging performance tests
npx playwright test e2e/staging-performance.spec.ts
```

#### Smoke Tests
```bash
# Run smoke tests against local server
npm run test:smoke

# Run smoke tests against production
npm run test:smoke:prod
```

### CI/CD Testing

#### GitHub Actions CI Pipeline
The CI pipeline runs automatically on every push and pull request:

1. **Unit & API Tests** - Runs with 80% coverage threshold
2. **E2E Tests** - Desktop Chrome, Mobile Chrome (Pixel 7), Mobile Safari (iPhone 14)
3. **Accessibility Tests** - WCAG 2.1 AA compliance
4. **Performance Tests** - Load time and performance budgets
5. **Coverage Reports** - Uploaded to Codecov

#### Staging Smoke Tests
Automated staging tests run on every push to main:

1. **Smoke Tests** - Basic functionality verification
2. **E2E Smoke Tests** - Critical user workflows
3. **Health Check Tests** - API endpoint verification
4. **Performance Tests** - Staging environment performance

### Test Coverage

- **Coverage Threshold**: 80% for branches, functions, lines, and statements
- **Coverage Reports**: Generated in HTML, JSON, and LCOV formats
- **Coverage Upload**: Automatically uploaded to Codecov in CI

### Test Data

All tests use mock data for consistency:
- **Admin User**: `admin@test.com` / `password123`
- **Parent User**: `parent@test.com` / `password123`
- **Mock Data**: Consistent test data across all test suites

### Debugging Tests

#### Playwright Debug Mode
```bash
# Debug specific test
npx playwright test e2e/admin-dashboard-comprehensive.spec.ts --debug

# Debug with UI
npx playwright test --ui
```

#### Test Reports
- **HTML Reports**: Generated in `playwright-report/` directory
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed tests
- **Traces**: Available for debugging failed tests

### Test Configuration

#### Playwright Configuration
- **Base URL**: Configurable via `BASE_URL` environment variable
- **Browsers**: Desktop Chrome, Mobile Chrome (Pixel 7), Mobile Safari (iPhone 14)
- **Retries**: 2 retries on CI, 0 locally
- **Parallel Execution**: Enabled for faster test runs

#### Vitest Configuration
- **Coverage Provider**: V8
- **Thresholds**: 80% global coverage
- **Reporters**: Text, JSON, HTML, LCOV
- **Environment**: Node.js

### Troubleshooting Tests

#### Common Issues

1. **Server Not Running**
   ```bash
   # Start server before running tests
   npm run build
   VITE_AUTH_PROVIDER=mock NODE_ENV=development PORT=3000 DATABASE_URL="postgresql://localhost:5432/cricket_academy" node dist/index.js
   ```

2. **Tests Failing Due to Missing Elements**
   - Check if server is running the latest code
   - Verify all required `data-testid` attributes are present
   - Check browser console for JavaScript errors

3. **Mobile Tests Failing**
   - Some mobile tests might fail in CI environments
   - This is expected and not critical for functionality

4. **Coverage Threshold Failures**
   - Add more tests to increase coverage
   - Exclude non-critical files from coverage
   - Adjust thresholds if necessary

## Environment Configuration

The application uses different environment files based on the `NODE_ENV` setting:

### Environment Files

- **`.env.development`** - Development environment (uses mock authentication)
- **`.env.test`** - Test environment (uses mock authentication)  
- **`.env.production`** - Production environment (uses Keycloak authentication)

### Environment Variables

| Variable | Development | Test | Production | Description |
|----------|-------------|------|------------|-------------|
| `AUTH_PROVIDER` | `mock` | `mock` | `keycloak` | Authentication provider |
| `NODE_ENV` | `development` | `test` | `production` | Environment mode |
| `PORT` | `3000` | `3001` | `3000` | Server port |
| `DATABASE_URL` | `postgresql://localhost:5432/cricket_academy` | `postgresql://localhost:5432/cricket_academy_test` | Set via hosting | Database connection |
| `VITE_AUTH_PROVIDER` | `mock` | `mock` | `keycloak` | Client-side auth provider |
| `VITE_KEYCLOAK_URL` | - | - | `https://your-keycloak-domain/auth` | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | - | - | `cricket-academy` | Keycloak realm |
| `VITE_KEYCLOAK_CLIENT_ID` | - | - | `cricket-coaching-spa` | Keycloak client ID |

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   The application automatically loads the correct environment file based on `NODE_ENV`:
   - Development: Uses `.env.development` (mock auth)
   - Test: Uses `.env.test` (mock auth)
   - Production: Uses `.env.production` (Keycloak auth)

3. **Start Development Server**
   ```bash
   # Development mode (uses .env.development)
   npm run dev
   
   # Test mode (uses .env.test)
   npm run dev:test
   ```

4. **Build and Run Production**
   ```bash
   # Build for production
   npm run build:prod
   
   # Start production server
   npm start
   ```

5. **Access the Application**
   - Development: http://localhost:3000
   - Test: http://localhost:3001
   - Production: http://localhost:3000 (or your hosting URL)

## Production Deployment

### Environment Variables for Hosting

When deploying to production (e.g., Render, Vercel, Railway), set these environment variables:

#### Required Variables
```bash
AUTH_PROVIDER=keycloak
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
VITE_AUTH_PROVIDER=keycloak
VITE_KEYCLOAK_URL=https://your-keycloak-domain/auth
VITE_KEYCLOAK_REALM=cricket-academy
VITE_KEYCLOAK_CLIENT_ID=cricket-coaching-spa
```

#### Optional Variables
```bash
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@cricketacademy.com
EMAIL_REPLY_TO=support@cricketacademy.com
CLIENT_URL=https://your-app-domain.com
```

### Email Configuration

The application supports email notifications via SendGrid. Email functionality is **optional** and will gracefully degrade when not configured.

#### Setting Up SendGrid

1. **Create SendGrid Account**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Verify your account and get your API key

2. **Verify Sender Domain (Recommended)**
   - Go to Settings → Sender Authentication
   - Add and verify your domain (e.g., `cricketacademy.com`)
   - This improves deliverability and allows custom "from" addresses

3. **Single Sender Verification (Quick Setup)**
   - Go to Settings → Sender Authentication → Single Sender Verification
   - Add your email address (e.g., `noreply@cricketacademy.com`)
   - Verify the email address

4. **Set Environment Variables**
   ```bash
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=noreply@cricketacademy.com
   EMAIL_REPLY_TO=support@cricketacademy.com
   ```

#### Testing Email Without Sending

When `SENDGRID_API_KEY` is not set, the application will:
- Log email content to the console instead of sending
- Show "Email disabled" banners in admin pages
- Return `{sent: false, reason: "disabled"}` from email endpoints

#### Test Email Endpoint (Development Only)

```bash
# Test email functionality
curl -X POST http://localhost:3000/api/dev/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

**Response when email disabled:**
```json
{
  "sent": false,
  "reason": "disabled",
  "preview": "To: test@example.com\nSubject: Test Email from Legacy Cricket Academy\n\n..."
}
```

**Response when email enabled:**
```json
{
  "sent": true,
  "id": "message_id_from_sendgrid"
}
```

### Render.com Deployment

1. **Create a new Web Service**
2. **Connect your GitHub repository**
3. **Set environment variables** in the Render dashboard:
   - `AUTH_PROVIDER` = `keycloak`
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = Your PostgreSQL connection string
   - `VITE_AUTH_PROVIDER` = `keycloak`
   - `VITE_KEYCLOAK_URL` = Your Keycloak URL
   - `VITE_KEYCLOAK_REALM` = `cricket-academy`
   - `VITE_KEYCLOAK_CLIENT_ID` = `cricket-coaching-spa`

4. **Build Command**: `npm run build:prod`
5. **Start Command**: `npm start`

### Build Commands

```bash
# Development build (uses .env.development)
npm run build

# Production build (uses .env.production)
npm run build:prod

# Start development server
npm run dev

# Start production server
npm start
```

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
- `GET /api/schedule/parent` - Get parent schedule (requires authentication)
- `GET /api/schedule/admin` - Get admin schedule (requires admin role)
- `GET /api/rsvps` - Get RSVP data for a session (requires authentication)
- `POST /api/rsvps` - Create/update RSVP response (requires authentication)
- `POST /api/admin/sessions` - Create new session (requires admin role)
- `PATCH /api/admin/sessions/:id` - Update session (requires admin role)
- `DELETE /api/admin/sessions/:id` - Delete session (requires admin role)
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `POST /api/payments/:id/remind` - Send payment reminder

## Schedule API Documentation

### Parent Schedule Endpoint

**GET** `/api/schedule/parent`

Returns schedule data for a parent user, including practices for their teams and games for selected kids.

**Authentication**: Required (JWT token)

**Query Parameters**:
- `from` (string, optional): Start date in ISO format (e.g., "2024-01-01T00:00:00Z")
- `to` (string, optional): End date in ISO format (e.g., "2024-01-31T23:59:59Z")
- `kidIds` (string, optional): Comma-separated list of kid IDs (e.g., "1,2,3")

**Response Format**:
```json
[
  {
    "id": 1,
    "type": "practice",
    "teamId": 1,
    "teamName": "Under 12s A",
    "start": "2024-01-15T10:00:00Z",
    "end": "2024-01-15T12:00:00Z",
    "location": "Field 1",
    "notes": "Focus on batting technique"
  },
  {
    "id": 2,
    "type": "game",
    "teamId": 1,
    "teamName": "Under 12s A",
    "start": "2024-01-20T14:00:00Z",
    "end": "2024-01-20T16:00:00Z",
    "location": "Cricket Ground",
    "opponent": "Riverside CC",
    "notes": "League match"
  }
]
```

**cURL Examples**:

```bash
# Get parent schedule for current week
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/schedule/parent?from=2024-01-15T00:00:00Z&to=2024-01-21T23:59:59Z"

# Get parent schedule for specific kids
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/schedule/parent?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z&kidIds=1,2"

# Get parent schedule for current month
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/schedule/parent?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z"
```

### Admin Schedule Endpoint

**GET** `/api/schedule/admin`

Returns all schedule data for admin users.

**Authentication**: Required (Admin JWT token)

**Query Parameters**:
- `from` (string, optional): Start date in ISO format
- `to` (string, optional): End date in ISO format

**Response Format**: Same as parent schedule endpoint

**cURL Examples**:

```bash
# Get admin schedule for current week
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:3000/api/schedule/admin?from=2024-01-15T00:00:00Z&to=2024-01-21T23:59:59Z"

# Get admin schedule for current month
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:3000/api/schedule/admin?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z"
```

### Schedule Data Types

**Practice Session**:
- `type`: "practice"
- `opponent`: Not present
- `notes`: Optional practice notes

**Game Session**:
- `type`: "game"
- `opponent`: Required opponent team name
- `notes`: Optional game notes

**Common Fields**:
- `id`: Unique identifier
- `teamId`: Team identifier
- `teamName`: Human-readable team name
- `start`: ISO 8601 start time
- `end`: ISO 8601 end time
- `location`: Venue name
- `notes`: Optional additional information

## RSVP API Documentation

### RSVP Endpoints

**GET** `/api/rsvps`

Returns RSVP data for a specific session, including counts and individual player responses.

**Authentication**: Required (JWT token)

**Query Parameters**:
- `sessionId` (number, required): ID of the session to get RSVPs for

**Response Format**:
```json
{
  "sessionId": 1,
  "counts": {
    "going": 8,
    "maybe": 3,
    "no": 2
  },
  "byPlayer": [
    {
      "playerId": 1,
      "playerName": "John Doe",
      "status": "going",
      "comment": "Looking forward to it!"
    },
    {
      "playerId": 2,
      "playerName": "Jane Smith",
      "status": "maybe",
      "comment": "Depends on weather"
    }
  ]
}
```

**cURL Examples**:

```bash
# Get RSVPs for session 1
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/rsvps?sessionId=1"

# Admin gets all player responses
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  "http://localhost:3000/api/rsvps?sessionId=1"

# Parent gets only their kids' responses
curl -H "Authorization: Bearer PARENT_JWT_TOKEN" \
  "http://localhost:3000/api/rsvps?sessionId=1"
```

**POST** `/api/rsvps`

Create or update an RSVP response for a player.

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "sessionId": 1,
  "playerId": 1,
  "status": "going",
  "comment": "Looking forward to it!"
}
```

**Response Format**:
```json
{
  "id": 123,
  "sessionId": 1,
  "playerId": 1,
  "parentUserId": 456,
  "status": "going",
  "comment": "Looking forward to it!",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**cURL Examples**:

```bash
# RSVP as "going" for player 1
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": 1, "playerId": 1, "status": "going", "comment": "Excited!"}' \
  "http://localhost:3000/api/rsvps"

# Change RSVP to "maybe"
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": 1, "playerId": 1, "status": "maybe", "comment": "Depends on weather"}' \
  "http://localhost:3000/api/rsvps"
```

### Admin Session Management

**POST** `/api/admin/sessions`

Create a new session (practice or game).

**Authentication**: Required (Admin JWT token)

**Request Body**:
```json
{
  "type": "practice",
  "teamId": 1,
  "teamName": "Under 12s A",
  "start": "2024-01-15T10:00:00Z",
  "end": "2024-01-15T12:00:00Z",
  "location": "Field 1",
  "opponent": "Riverside CC",
  "notes": "Focus on batting technique"
}
```

**PATCH** `/api/admin/sessions/:id`

Update an existing session.

**Authentication**: Required (Admin JWT token)

**Request Body**: Partial session data (any fields to update)

**DELETE** `/api/admin/sessions/:id`

Delete a session.

**Authentication**: Required (Admin JWT token)

**Response**: 204 No Content

### RSVP Data Types

**RSVP Status**:
- `going`: Player will attend
- `maybe`: Player might attend
- `no`: Player will not attend

**Session Types**:
- `practice`: Training session
- `game`: Competitive match

**Authorization Rules**:
- Parents can only RSVP for players they are linked to via family relationships
- Admins can view all RSVPs and manage sessions
- RSVP responses are unique per (sessionId, playerId) combination

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: Keycloak/Firebase/Mock
- **Email**: SendGrid
- **Testing**: Vitest + Playwright
- **Styling**: Tailwind CSS + shadcn/ui

## UI Test Contract

The application maintains a comprehensive UI test contract to ensure consistent testing across all components. All UI elements are tagged with standardized `data-testid` attributes.

### Test ID Registry

The central test ID registry is located at `client/src/ui/testids.ts` and contains all test identifiers used throughout the application:

```typescript
export const TID = {
  header: {
    roleBadge: 'role-badge',
    userMenuTrigger: 'user-menu-trigger',
    userMenuProfile: 'user-menu-profile',
    userMenuSettings: 'user-menu-settings',
    userMenuSignout: 'user-menu-signout',
  },
  dashboard: {
    title: 'dashboard-title',
    stats: 'stats-card',
    players: 'players-card',
    fitness: 'fitness-card',
    meal: 'meal-plan-card',
    payments: 'payment-card',
    schedule: 'schedule-card',
    announcements: 'announcements-card',
  },
  schedule: {
    page: 'schedule-page',
    tabs: 'schedule-tabs',
    tabAll: 'tab-all',
    tabPractices: 'tab-practices',
    tabGames: 'tab-games',
    viewSelect: 'view-mode-select',
    viewWeek: 'view-week',
    viewMonth: 'view-month',
    kidFilter: 'kid-filter',
    rsvpGoing: 'rsvp-going',
    rsvpMaybe: 'rsvp-maybe',
    rsvpNo: 'rsvp-no',
  },
  admin: {
    page: 'admin-sessions-page',
    createBtn: 'create-session',
    list: 'session-list',
    row: (id: string | number) => `session-row-${id}`,
    save: 'session-save',
    cancel: 'session-cancel',
  },
  account: {
    page: 'account-page',
    tabProfile: 'account-tab-profile',
    tabSecurity: 'account-tab-security',
    tabNotifications: 'account-tab-notifications',
    tabChildren: 'account-tab-children',
    tabOrg: 'account-tab-organization',
  },
  common: { 
    empty: 'empty-state', 
    skeleton: 'skeleton' 
  }
} as const;
```

### UI Smoke Test

A comprehensive smoke test (`e2e/ui.smoke.contract.spec.ts`) verifies that all required UI components and test IDs are present across different pages and user roles:

- **Dashboard Components**: All cards with proper test IDs
- **Schedule Page**: Tabs, filters, and RSVP controls
- **Admin Sessions**: Create/edit controls and session management
- **Account Page**: Role-aware tab navigation
- **Header Components**: User menu and role badge
- **Empty States**: Proper handling of empty data scenarios

### Running UI Tests

```bash
# Run the UI smoke test
npx playwright test e2e/ui.smoke.contract.spec.ts

# Run all E2E tests
npm run test:e2e
```

### Test ID Guidelines

1. **Consistency**: All test IDs must use the centralized registry
2. **Descriptive**: Test IDs should clearly describe the element's purpose
3. **Stable**: Test IDs should not change unless the component is refactored
4. **Accessible**: All interactive elements must have test IDs
5. **Role-Aware**: Some test IDs are conditional based on user role

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details
