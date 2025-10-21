# ⚙️ Render Environment Variable Setup

## 🔴 **CRITICAL: Missing Environment Variables on Render**

The registration + email tests are failing because Render doesn't have the required environment variables set.

---

## 📝 **Required Environment Variables**

Add these to your Render service:

### **Registration Email Recipients**
```bash
ADMIN_EMAIL=madhukar.kcc@gmail.com
COACH_EMAILS=coach1@test.com,coach2@test.com
```

### **Email Delivery Control (for testing)**
```bash
EMAIL_NOTIFICATIONS=false
# When false: emails go to test mailbox at /api/_mailbox
# When true: emails sent via SendGrid (requires SENDGRID_API_KEY)
```

### **Optional: SendGrid Integration** (only if EMAIL_NOTIFICATIONS=true)
```bash
SENDGRID_API_KEY=SG.your_actual_key_here
FROM_EMAIL=legacy@legacycricketacademy.com
```

---

## 🚀 **How to Add Environment Variables on Render**

### **Option 1: Render Dashboard (Recommended)**
1. Go to https://dashboard.render.com
2. Select your service (`cricket-academy-app` or similar)
3. Click on **Environment** tab
4. Add each variable:
   - Key: `ADMIN_EMAIL`
   - Value: `madhukar.kcc@gmail.com`
   - Click **Save**
5. Repeat for `COACH_EMAILS` and `EMAIL_NOTIFICATIONS`
6. Service will auto-redeploy with new variables

### **Option 2: render.yaml (for automation)**
```yaml
services:
  - type: web
    name: cricket-academy-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: ADMIN_EMAIL
        value: madhukar.kcc@gmail.com
      - key: COACH_EMAILS
        value: coach1@test.com,coach2@test.com
      - key: EMAIL_NOTIFICATIONS
        value: false
```

---

## 🧪 **Testing After Setup**

### **1. Verify Mailbox is Clear**
```bash
curl https://cricket-academy-app.onrender.com/api/_mailbox
# Should return: {"messages": []}
```

### **2. Test Registration Manually**
1. Open: https://cricket-academy-app.onrender.com/login
2. Click "Register"
3. Fill form with test data
4. Submit
5. Should see: "Thank you! We received your registration."

### **3. Check Mailbox for Emails**
```bash
curl https://cricket-academy-app.onrender.com/api/_mailbox | jq '.'
# Should show 3 messages:
# - Parent confirmation
# - Admin alert
# - Coach broadcast
```

### **4. Run E2E Tests**
```bash
export BASE_URL=https://cricket-academy-app.onrender.com
export ADMIN_EMAIL=madhukar.kcc@gmail.com
export COACH_EMAILS=coach1@test.com,coach2@test.com

# Single run
npm run test:golive

# 20× gate
npm run test:golive:20x
```

---

## 📊 **Current Status**

- ✅ Code deployed to Render
- ✅ `/api/_mailbox` endpoint accessible
- ✅ `/api/registration` endpoint accessible  
- ❌ **Environment variables NOT set**
- ❌ Tests failing: "Admin email not found"

**Next Step:** Add environment variables to Render, wait 1-2 minutes for redeploy, then retest.

---

## 🎯 **Expected Results After Fix**

```bash
npm run test:golive

Running 2 tests using 2 workers
  ✓  [Desktop Chrome] › registers and sends parent/admin/coach emails (1.5s)
  ✓  [Mobile Chrome (Pixel 5)] › registers and sends parent/admin/coach emails (1.6s)
  2 passed (3.2s)
```

Then run 20× gate:
```bash
npm run test:golive:20x
# Expected: 40/40 passed
```

---

**⚠️ USER ACTION REQUIRED:** Please add the environment variables to Render as shown above.
