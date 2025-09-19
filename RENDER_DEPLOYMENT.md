# Render Deployment Configuration

## Required Render Settings

### Service Configuration
- **Branch**: `fix-port-configuration`
- **Start Command**: `node dist/server/index.js`
- **Build Command**: `npm run build` (uses: `tsc && vite build`)

### Environment Variables
- **PORT**: Let Render set this automatically (DO NOT set manually)
- Other environment variables as needed for your app

## Post-Deploy Troubleshooting

### Clear Render Cache
If deployment fails or shows old behavior:
1. Go to Render Dashboard → Your Service → Settings → Build & Deploy
2. Click "Clear build cache"
3. Go to Manual Deploy → Deploy latest commit

### Expected Logs
✅ **Success indicators:**
```
Server running at http://localhost:<PORT_FROM_ENV>
```

❌ **Failure indicators:**
- Any reference to port 3000 in logs
- EADDRINUSE errors
- "Cricket Academy server running on http://0.0.0.0:3000" (indicates old cached build)

## Architecture
- TypeScript server compiled to `dist/server/index.js`
- React client built to `dist/public`
- Single entry point: `server/index.ts` → `dist/server/index.js`
- Dynamic port binding: `process.env.PORT || 3001`
