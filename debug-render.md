# Render Deployment Debug Guide

## Issue: Server not responding (404 on all endpoints)

### Likely Causes:
1. **Missing SESSION_SECRET** - Set in render.yaml as `sync: false`
2. **Database connection issues** - PostgreSQL not accessible
3. **Build failures** - Server not starting due to errors

### Required Environment Variables in Render Dashboard:
```
SESSION_SECRET=<random-hex-string>
SENDGRID_API_KEY=<your-sendgrid-key>
DATABASE_URL=<auto-set-from-database>
```

### Steps to Fix:

1. **Set SESSION_SECRET in Render Dashboard:**
   - Go to Render Dashboard → Services → legacy-cricket-academy
   - Go to Environment tab
   - Add: `SESSION_SECRET` = `5337c05527bba18bebb26d3cd134bebee592d3a6ebc7773a314dc33dbe5b2a98`

2. **Check Build Logs:**
   - Go to Render Dashboard → Services → legacy-cricket-academy
   - Check "Build Logs" for errors

3. **Check Runtime Logs:**
   - Go to Render Dashboard → Services → legacy-cricket-academy
   - Check "Runtime Logs" for startup errors

### Test Commands (once fixed):
```bash
# Health check
curl https://legacy-cricket-app.onrender.com/healthz

# Session check
curl https://legacy-cricket-app.onrender.com/api/session

# Login test
curl -X POST https://legacy-cricket-app.onrender.com/api/dev/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test1234!"}'
```

### Current Status:
- ✅ Local login working perfectly
- ✅ Authentication hardening complete
- ✅ Email testing setup complete
- ❌ Render deployment not starting (likely missing SESSION_SECRET)
