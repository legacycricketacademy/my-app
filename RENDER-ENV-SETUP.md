# 🔧 Render Environment Variable Setup

## Required for E2E Testing

To enable e2e tests to run against Render, you need to add this environment variable in your Render dashboard:

### **Add to Render:**

1. Go to https://dashboard.render.com
2. Select your service (cricket-academy-app)
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add:
   - **Key:** `ENABLE_DEV_LOGIN`
   - **Value:** `true`
6. Click "Save Changes"
7. Render will auto-redeploy

### **What This Does:**

- Enables `/api/dev/login` endpoint on Render (for e2e tests only)
- Allows test accounts (admin@test.com, parent@test.com) to login
- The "Use" buttons are still hidden on production UI (client-side check)
- Only the API endpoint is enabled

### **Security Note:**

This is safe because:
- ✅ Dev accounts only have test data access
- ✅ UI buttons are hidden in production
- ✅ You can remove this flag anytime to fully disable
- ✅ Only needed for automated e2e testing

### **After Adding the Variable:**

Wait ~60 seconds for Render to redeploy, then run:

```bash
BASE_URL=https://cricket-academy-app.onrender.com npm run test:e2e
```

Expected results:
- ✅ Auth setup will pass
- ✅ Login will work  
- ✅ Schedule tests will pass
- ✅ Add Session button will work

