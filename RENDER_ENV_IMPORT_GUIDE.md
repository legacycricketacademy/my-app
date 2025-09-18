# 🚀 Render Environment Variables - Easy Import Guide

## 📋 Option 1: Copy-Paste Method (Recommended)

### Step 1: Copy All Variables
Copy this entire block and paste into Render's Environment Variables section:

```
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

### Step 2: How to Import in Render
1. **Go to your Render Web Service settings**
2. **Click on "Environment" tab**
3. **Look for "Add from .env"** or **"Bulk Add"** button
4. **Paste the variables above** into the text area
5. **Click "Add Variables"**

### Step 3: Add Final Variable After Deployment
After your app deploys, add this variable:
```
VITE_APP_URL=https://your-actual-app-name.onrender.com
```

## 📁 Option 2: File Upload Method

If Render supports file upload:
1. **Download the `.env.render` file** from your repository
2. **Upload it** in Render's Environment Variables section
3. **Add VITE_APP_URL** after deployment

## ✅ Verification Checklist

After adding environment variables, verify you have:
- [ ] NODE_ENV=production
- [ ] HOST=0.0.0.0
- [ ] PORT=3000
- [ ] DATABASE_URL=sqlite:./production.db
- [ ] LOCAL_ADMIN_BYPASS=true
- [ ] KEYCLOAK_ENABLED=true
- [ ] VITE_KEYCLOAK_URL=https://keycloak-service.onrender.com
- [ ] VITE_KEYCLOAK_ISSUER_URL=https://keycloak-service.onrender.com/realms/cricket-academy
- [ ] VITE_KEYCLOAK_REALM=cricket-academy
- [ ] VITE_KEYCLOAK_CLIENT_ID=my-app
- [ ] VITE_REDIRECT_PATH=/auth/callback
- [ ] VITE_APP_URL=https://your-actual-app-name.onrender.com (add after deployment)

## 🎯 Quick Deploy Steps with Environment Import

1. **Create Web Service** in Render
2. **Connect GitHub**: `legacycricketacademy/my-app`
3. **Select branch**: `feat/admin-coach-approval`
4. **Set Build/Start commands**:
   - Build: `npm run build`
   - Start: `node dist/index.js`
5. **Import environment variables** using the block above
6. **Deploy!**
7. **Add VITE_APP_URL** after getting your Render URL

Your Cricket Academy app will be live in minutes! 🚀
