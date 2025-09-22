# Environment Variables

This document describes the environment variables required for the Legacy Cricket Academy application.

## Required Variables

### Database
```bash
DATABASE_URL="postgresql://localhost:5432/cricket_academy"
```

### Server
```bash
PORT=3000
NODE_ENV=development
```

### Authentication Provider
```bash
# Choose authentication provider: keycloak, firebase, or mock
VITE_AUTH_PROVIDER=mock
```

### Firebase Authentication
```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### Keycloak Authentication
```bash
VITE_KEYCLOAK_URL=https://your-keycloak-instance.com
VITE_KEYCLOAK_REALM=cricket-academy
VITE_KEYCLOAK_CLIENT_ID=cricket-coaching-spa
```

### SendGrid Email Service
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@legacycricketacademy.com
EMAIL_REPLY_TO=support@legacycricketacademy.com
```

### Client URL (for email links)
```bash
CLIENT_URL=http://localhost:3000
```

## Development Test Users

The application includes mock authentication for development:

- **Parent Account**: `parent@test.com` / `Test1234!` (role=parent)
- **Admin Account**: `admin@test.com` / `Test1234!` (role=admin)

## Setup Instructions

1. Copy this file to `.env` in the project root
2. Fill in the actual values for your environment
3. For development, you can use the mock authentication without Firebase/Keycloak
4. For email functionality, configure SendGrid or leave SENDGRID_API_KEY empty to log emails to console
