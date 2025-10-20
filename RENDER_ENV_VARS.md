# Required Render Environment Variables

Please add these environment variables to your Render service:

## Required for Dev Login to Work

```
ENABLE_DEV_LOGIN=true
VITE_ENABLE_DEV_LOGIN=true
```

## Other Required Variables

```
NODE_ENV=production
SESSION_SECRET=<your-strong-secret>
DATABASE_URL=<your-postgres-url>
APP_ORIGIN=https://cricket-academy-app.onrender.com
CORS_ORIGIN=https://cricket-academy-app.onrender.com
```

## Steps to Add These on Render:

1. Go to your Render dashboard
2. Select your web service (cricket-academy-app)
3. Go to "Environment" tab
4. Add each variable with its value
5. Click "Save Changes"
6. Render will automatically redeploy

## After Setting Variables:

Test the dev login endpoint:
```bash
curl -i -c /tmp/c.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com"}' \
  https://cricket-academy-app.onrender.com/api/dev/login
```

Expected: HTTP/2 200 with `Set-Cookie: connect.sid=...`

