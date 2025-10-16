# Legacy Cricket Academy

Comprehensive cricket academy management system for player development, coaching workflows, and family engagement.

## Development

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev
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

**Start Command:**
```bash
node dist/index.js
```

### Environment Variables

Set the following in Render Dashboard:

- `DATABASE_URL` - PostgreSQL connection string (automatically provided by Render Database)
- `NODE_ENV` - Set to `production`
- `SESSION_SECRET` - Generate a random secret
- `PORT` - Set to `10000` (or use Render's default)

**Optional Alternative:** Set `NPM_CONFIG_PRODUCTION=false` as an environment variable instead of using `--include=dev` in the build command.

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

