# Test Environment Setup

## Local E2E Testing

Create a `.env.test.local` file (already in .gitignore) with these variables:

```bash
# Test environment variables (local tests only)
NODE_ENV=development
APP_ENV=development
SESSION_SECRET=dev-cookie-secret-change-me-in-production
SESSION_NAME=connect.sid
BASE_URL=http://localhost:3000

# NO DATABASE_URL so PG store won't be used (memory store instead)

# Test credentials
E2E_EMAIL=admin@test.com
E2E_PASSWORD=Test1234!
```

## Render E2E Testing

Set these environment variables in your GitHub Secrets or CI:

```bash
RENDER_BASE_URL=https://your-app.onrender.com
E2E_EMAIL=admin@test.com
E2E_PASSWORD=Test1234!
NODE_ENV=production
```

## Running Tests

### Local tests (with dev login):
```bash
npm run test:e2e:local
```

### Render tests (with real auth):
```bash
RENDER_BASE_URL=https://your-app.onrender.com npm run test:e2e:render
```

### All tests:
```bash
npm run test:e2e
```

