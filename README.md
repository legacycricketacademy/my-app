# Legacy Cricket Academy

Comprehensive cricket academy management system for player development, coaching workflows, and family engagement.

## Local PostgreSQL Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Installation

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb cricket_dev
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb cricket_dev
```

**Windows:**
Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)

### Environment Setup

Create a `.env` file in the project root:
```bash
DATABASE_URL=postgres://localhost:5432/cricket_dev
SESSION_SECRET=dev-secret-change-me
NODE_ENV=development
```

### Development

```bash
# Install dependencies
npm install

# Generate and run database migrations
npm run db:generate
npm run db:migrate

# Seed the database with test data
npm run db:seed

# Start development server
npm run dev
```

### Database Management

```bash
# Generate new migrations after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed database with test data
npm run db:seed
```

## Build

```bash
# Build client and server
npm run build

# Start production server
node dist/index.js
```

## Deploy on Render

### Configuration

**Build Command:**
```bash
npm ci --include=dev && npm run build
```

**Pre-Deploy Command:**
```bash
npm run db:migrate
```

**Start Command:**
```bash
node dist/index.js
```

### Environment Variables

Set the following in Render Dashboard:

- `DATABASE_URL` - PostgreSQL connection string (automatically provided by Render Database)
- `NODE_ENV` - Set to `production`
- `SESSION_SECRET` - Generate a random secret (required for sessions)
- `PORT` - Set to `10000` (or use Render's default)

### Session Configuration

The app uses PostgreSQL for session storage in production:
- Sessions are stored in the `session` table (created automatically)
- Cookies are configured with `secure: true` and `sameSite: 'none'` for HTTPS
- Trust proxy is enabled for Render's load balancer

### Why devDependencies are Required

Our build process uses `vite` and `esbuild` which are intentionally kept in `devDependencies`:
- `vite` is used at build-time to bundle the React client
- `esbuild` is used at build-time to bundle the Node.js server
- These tools are NOT needed at runtime, only during the build phase

The `--include=dev` flag ensures these build tools are available during Render's build phase, while keeping the production runtime lean.

### Database Setup

Render will automatically:
1. Create a PostgreSQL database
2. Provide `DATABASE_URL` to your app
3. Run migrations during build via `npm run db:push`

### Troubleshooting

**Build fails with "vite: not found":**
- Ensure Build Command includes `--include=dev` flag
- OR set environment variable `NPM_CONFIG_PRODUCTION=false`

**502 Bad Gateway:**
- Check Render logs for startup errors
- Verify `DATABASE_URL` is set correctly
- Ensure migrations ran successfully

## Testing

```bash
# Run end-to-end tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui
```

## Database

```bash
# Push schema changes to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

