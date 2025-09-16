# Legacy Cricket Academy Management System

A comprehensive cricket academy management system for player development, coaching workflows, and family engagement.

## 🏏 Features

- **Admin Coach Management**: Approve/reject coach applications with search and pagination
- **Parent Dashboard**: View schedules, stats, and manage payments
- **Authentication**: Keycloak integration (can be disabled for local development)
- **Payment Scheduling**: MVP payment scheduling functionality
- **Responsive UI**: Built with Next.js, shadcn/ui, and Tailwind CSS

## 🚀 Quick Start (Local Development - No Keycloak)

### Prerequisites
- Node.js 18+
- SQLite3

### Setup & Run

```bash
# 1. Clone and setup
git checkout feat/admin-coach-approval
npm ci --no-audit --no-fund

# 2. Seed database (creates dev.db with sample coaches)
node scripts/seed.cjs

# 3. Build application
rm -rf dist && npm run build

# 4. Run server (no Keycloak)
LOCAL_ADMIN_BYPASS=true \
NODE_ENV=production \
HOST=127.0.0.1 \
PORT=3002 \
DATABASE_URL=sqlite:$(pwd)/dev.db \
KEYCLOAK_ENABLED=false \
KEYCLOAK_ISSUER_URL=https://example.com/realms/dummy \
node dist/index.js
```

### Access the Application
- **Parent View**: http://localhost:3002 (shows login page)
- **Admin View**: Use DevTools console with admin bypass (see below)

## 🔧 Development Configuration

### Environment Variables

| Variable | Description | Local Dev Value |
|----------|-------------|-----------------|
| `LOCAL_ADMIN_BYPASS` | Enable admin bypass for local dev | `true` |
| `KEYCLOAK_ENABLED` | Enable/disable Keycloak auth | `false` |
| `DATABASE_URL` | SQLite database path | `sqlite:$(pwd)/dev.db` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3002` |

### Database Seeding

The seed script creates sample data for testing:

```bash
# Seed database with sample coaches
node scripts/seed.cjs
```

**Sample Data Created:**
- 1 pending coach (Aryan Coach)
- 2 approved coaches (Jane Smith, John Doe)

### Admin API Access (Local Development)

For local development, admin APIs require the `x-local-admin: 1` header:

```javascript
// Health check
fetch("/api/ping").then(r=>r.json()).then(console.log)

// Get pending coaches
fetch("/api/coaches?status=pending", { 
  headers: { "x-local-admin": "1" } 
}).then(r=>r.json()).then(console.log)

// Approve coach
fetch("/api/coaches/1/approve", {
  method: "POST",
  headers: { "x-local-admin": "1" }
}).then(r=>r.json()).then(console.log)

// Reject coach
fetch("/api/coaches/2/reject", {
  method: "POST", 
  headers: { "x-local-admin": "1" }
}).then(r=>r.json()).then(console.log)

// Search coaches
fetch("/api/coaches?search=aryan", { 
  headers: { "x-local-admin": "1" } 
}).then(r=>r.json()).then(console.log)

// Pagination
fetch("/api/coaches?limit=1&offset=1", { 
  headers: { "x-local-admin": "1" } 
}).then(r=>r.json()).then(console.log)

// Schedule payment
fetch("/api/payments/schedule", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json", 
    "x-local-admin": "1" 
  },
  body: JSON.stringify({
    amount: 175,
    nextDate: "2025-10-01"
  })
}).then(r=>r.json()).then(console.log)
```

## 📊 API Endpoints

### Public Endpoints
- `GET /api/ping` - Health check

### Admin Endpoints (require `x-local-admin: 1` header in local dev)
- `GET /api/coaches?status=&search=&limit=&offset=` - Unified coaches list
- `POST /api/coaches/:id/approve` - Approve coach
- `POST /api/coaches/:id/reject` - Reject coach
- `POST /api/payments/schedule` - Schedule payment (MVP stub)

### Parent Endpoints
- `GET /api/dashboard/schedule` - Get schedule data
- `GET /api/dashboard/stats` - Get stats data
- `GET /api/dashboard/payments` - Get payment data

## 🔐 Authentication

### Local Development (Keycloak Disabled)
- Set `KEYCLOAK_ENABLED=false`
- Set `LOCAL_ADMIN_BYPASS=true`
- Use `x-local-admin: 1` header for admin API calls
- Parents see login page (expected behavior)

### Production (Keycloak Enabled)
```bash
# Enable Keycloak for production
KEYCLOAK_ENABLED=true
KEYCLOAK_ISSUER_URL=https://your-keycloak-domain/realms/your-realm
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret
# Remove LOCAL_ADMIN_BYPASS (security)
```

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js with TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query
- **Icons**: Lucide React
- **Themes**: next-themes for dark mode

### Backend
- **Framework**: Express.js
- **Database**: SQLite (local) / PostgreSQL (production)
- **Authentication**: Keycloak (optional)
- **Session**: express-session with MemoryStore

### Key Files
- `client/src/pages/admin/coaches-pending-approval.tsx` - Admin coach management
- `client/src/pages/parent-dashboard.tsx` - Parent dashboard
- `server/index.ts` - Express server with API routes
- `scripts/seed.cjs` - Database seeding script

## 🚀 Deployment

### Local Development
```bash
# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
node dist/index.js
```

## 🔧 Troubleshooting

### Common Issues

1. **Admin routes redirect to login**
   - Ensure `LOCAL_ADMIN_BYPASS=true` is set
   - Use `x-local-admin: 1` header in API calls

2. **Database not found**
   - Run `node scripts/seed.cjs` to create and seed database

3. **Build warnings about duplicate methods**
   - Fixed in current version - should build cleanly

4. **Payments API returns HTML**
   - Ensure server is restarted after code changes
   - Check server logs for errors

### Debug Commands
```bash
# Check server process
ps aux | grep "node dist/index.js"

# Test API health
curl http://localhost:3002/api/ping

# Test admin API
curl -H "x-local-admin: 1" http://localhost:3002/api/coaches?status=pending

# View server logs
tail -f server.log
```

## 📝 Development Notes

- **Branch**: `feat/admin-coach-approval` (do NOT merge to main yet)
- **Local Admin Bypass**: For development only - never enable in production
- **Payment Integration**: Currently MVP stub - will be replaced with real payment processing
- **Keycloak**: Disabled for parent rollout - will be re-enabled later

## 🎯 Next Steps

1. **Parent Rollout**: Deploy with `KEYCLOAK_ENABLED=false`
2. **Payment Integration**: Replace stub with real payment processing
3. **Keycloak Integration**: Re-enable authentication for full production
4. **Coach Onboarding**: Implement coach registration flow

---

**Ready for Parent Rollout** 🏏✨

## 🚀 Production Deployment (Render)

### Environment Variables for Render
Add these environment variables in your Render Web Service:

```bash
# Server Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Database
DATABASE_URL=sqlite:./production.db

# Keycloak Configuration (Production)
VITE_KEYCLOAK_URL=https://keycloak-service.onrender.com
VITE_KEYCLOAK_ISSUER_URL=https://keycloak-service.onrender.com/realms/cricket-academy
VITE_KEYCLOAK_REALM=cricket-academy
VITE_KEYCLOAK_CLIENT_ID=my-app
VITE_APP_URL=https://my-frontend.onrender.com
VITE_REDIRECT_PATH=/auth/callback

# Optional: Admin bypass for initial setup
LOCAL_ADMIN_BYPASS=true
KEYCLOAK_ENABLED=true
```

### Render Service Configuration
- **Build Command**: `npm run build`
- **Start Command**: `node dist/index.js`
- **Branch**: `feat/admin-coach-approval`
- **Auto-Deploy**: Enabled

### Verification
After deployment, check build logs to confirm:
- Frontend uses `https://keycloak-service.onrender.com` instead of `localhost:8081`
- All VITE_* environment variables are properly injected during build
- Login button redirects to production Keycloak service

