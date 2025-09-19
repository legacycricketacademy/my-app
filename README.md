# Legacy Cricket Academy

## Render Deployment Instructions

### 1. Environment Variables

Make sure these environment variables are set in your Render service:

```
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
DATABASE_URL=sqlite:./production.db
LOCAL_ADMIN_BYPASS=true
KEYCLOAK_ENABLED=true
VITE_KEYCLOAK_URL=https://keycloak-24-0-tbwj.onrender.com
VITE_KEYCLOAK_ISSUER_URL=https://keycloak-24-0-tbwj.onrender.com/realms/cricket-academy
VITE_KEYCLOAK_REALM=cricket-academy
VITE_KEYCLOAK_CLIENT_ID=my-app
VITE_REDIRECT_PATH=/auth/callback
VITE_APP_URL=https://cricket-academy-app.onrender.com
```

### 2. Build & Start Commands

Update your Render service configuration with these exact settings:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 3. Important Notes

- The server will serve the React app from `dist/public/`
- All API routes are preserved under `/api/*`
- Static assets are served with proper caching
- SPA routing is handled via catch-all route
- Health check available at `/healthz`

### 4. Post-Deployment Verification

1. Visit `https://cricket-academy-app.onrender.com`
2. Verify you see the full React UI (not just "Home Page")
3. Test Keycloak login integration
4. Verify all API endpoints work
5. Check deep linking works (refresh any route)

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Routes

- `GET /api/ping` - Health check
- `GET /api/coaches` - List coaches with filters
- `POST /api/coaches/:id/approve` - Approve coach
- `POST /api/coaches/:id/reject` - Reject coach
- `POST /api/payments/schedule` - Schedule payment
