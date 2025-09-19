# Legacy Cricket Academy - DEPLOYMENT INSTRUCTIONS

## 🚨 CRITICAL: Render Service Configuration

### Build Command
```
npm run build
```

### Start Command (IMPORTANT!)
```
npm start
```

**NOT** `node start` - this will fail!

### Environment Variables

Set these in your Render service:

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

## 🎉 BUILD STATUS: SUCCESS!

The build is now working perfectly:
- ✅ Vite build: 1661 modules transformed
- ✅ Assets generated: CSS (72.99 kB) + JS (285.80 kB)
- ✅ Server bundle: 74.2kb

## 🔧 CURRENT ISSUE: Start Command

The deployment fails because Render is running:
```bash
node start  # ❌ WRONG - this looks for /src/start file
```

Instead of:
```bash
npm start   # ✅ CORRECT - this runs our package.json script
```

## 📋 Fix Instructions

1. Go to Render Dashboard
2. Select your `cricket-academy-app` service
3. Go to Settings
4. Update **Start Command** to: `npm start`
5. Save and redeploy

## 🏏 Expected Result

After fixing the start command, you should see:
- Beautiful "Welcome to Legacy Cricket Academy" login page
- Full React UI with shadcn/ui components
- Working Keycloak integration
- All API endpoints functional

The React app is fully built and ready - just need the correct start command!
