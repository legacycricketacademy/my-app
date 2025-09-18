# 🏏 Cricket Academy - Render.com Deployment Guide

## 🚀 Quick Deploy to Render

### Step 1: Create Web Service
1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub: `legacycricketacademy/my-app`
4. Select branch: `feat/admin-coach-approval`

### Step 2: Service Configuration
```
Name: cricket-academy-app
Environment: Node
Region: Oregon (US West)
Branch: feat/admin-coach-approval
Build Command: npm run build
Start Command: node dist/index.js
```

### Step 3: Environment Variables
Copy and paste these in Render's Environment section:

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
DATABASE_URL=sqlite:./production.db
LOCAL_ADMIN_BYPASS=true
KEYCLOAK_ENABLED=true
VITE_KEYCLOAK_URL=https://keycloak-service.onrender.com
VITE_KEYCLOAK_ISSUER_URL=https://keycloak-service.onrender.com/realms/cricket-academy
VITE_KEYCLOAK_REALM=cricket-academy
VITE_KEYCLOAK_CLIENT_ID=my-app
VITE_REDIRECT_PATH=/auth/callback
```

**IMPORTANT**: Replace `VITE_APP_URL` with your actual Render URL after deployment!

### Step 4: Advanced Settings
- **Auto-Deploy**: Yes
- **Health Check Path**: `/api/ping`
- **Plan**: Starter (Free) or Professional ($7/month)

## 🔧 Post-Deployment Steps

### 1. Update VITE_APP_URL
After your app deploys, you'll get a URL like `https://cricket-academy-app.onrender.com`

Go back to Environment Variables and add:
```bash
VITE_APP_URL=https://your-actual-app-url.onrender.com
```

### 2. Test Your Deployment
Visit these URLs to verify:
- **Health Check**: `https://your-app.onrender.com/api/ping`
- **Auth Page**: `https://your-app.onrender.com/auth`
- **Admin APIs**: Use browser console with `x-local-admin: '1'` header

### 3. Verify Build Logs
Check that build logs show:
- ✅ `npm run build` completes successfully
- ✅ Frontend uses `keycloak-service.onrender.com` URLs
- ✅ No `localhost:8081` references in production build

## 🏆 Expected Results

### ✅ Working Features
- Professional "Welcome to Legacy Cricket Academy" login page
- All 7 admin APIs functional with `x-local-admin: '1'` header
- Payment scheduling API working
- Keycloak login redirects to production URLs

### 🔍 Testing Commands (Browser Console)
```javascript
// Health Check
fetch('/api/ping').then(r=>r.json()).then(console.log)

// Admin APIs
fetch('/api/coaches?status=pending',{headers:{'x-local-admin':'1'}}).then(r=>r.json()).then(console.log)
fetch('/api/coaches?status=approved',{headers:{'x-local-admin':'1'}}).then(r=>r.json()).then(console.log)
fetch('/api/payments/schedule',{method:'POST',headers:{'Content-Type':'application/json','x-local-admin':'1'},body:JSON.stringify({amount:175,nextDate:'2025-10-01'})}).then(r=>r.json()).then(console.log)
```

## 🛠️ Troubleshooting

### Build Fails
- Check that `package.json` has all dependencies
- Verify Node.js version compatibility
- Check build logs for missing environment variables

### App Won't Start
- Verify `PORT=3000` environment variable
- Check that `dist/index.js` exists after build
- Review application logs in Render dashboard

### Environment Variables Not Working
- Ensure all VITE_* variables are set before build
- Redeploy after adding new environment variables
- Check build logs for environment variable injection

## 📞 Support
If you encounter issues, check:
1. Render build logs
2. Application logs
3. Browser console for frontend errors
4. Network tab for API call failures

Your app is ready for production deployment! 🚀
