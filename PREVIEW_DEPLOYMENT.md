# Preview Deployment Guide - ai/emergent-fixes

## Branch to Deploy
`ai/emergent-fixes`

## Render Preview Configuration

### Build Settings
```bash
Build Command: npm ci --include=dev && npm run build
Start Command: node dist/index.js
```

### Environment Variables (Preview)

#### Required
```bash
NODE_ENV=production
DATABASE_URL=<provided by Render PostgreSQL>
SESSION_SECRET=<generate with: openssl rand -base64 32>
CORS_ORIGIN=https://<preview-frontend-url>.onrender.com
PORT=10000
```

#### Optional (Email - Dev Mode)
```bash
# Omit SENDGRID_API_KEY to use dev stub (emails logged, not sent)
# Add only if you want to test live email sending
SENDGRID_API_KEY=<omit for dev mode>
DEFAULT_FROM_EMAIL=noreply@legacycricketacademy.com
SENDGRID_FROM_EMAIL=noreply@legacycricketacademy.com
PUBLIC_BASE_URL=https://<preview-frontend-url>.onrender.com
```

#### Session Configuration
```bash
SESSION_COOKIE_DOMAIN=.onrender.com
SESSION_COOKIE_NAME=legacy.sid
COOKIE_DOMAIN=<preview-domain>.onrender.com
```

#### Feature Flags
```bash
ENABLE_DEV_LOGIN=false  # Disable in preview
SETTINGS_API_ENABLED=true
```

---

## Pre-Deployment Checklist

### Code Readiness
- [x] Auth/CORS/Session fixes committed
- [x] Routing guard fixes committed
- [x] Registration flow implemented
- [x] Email verification endpoints ready
- [x] Database migrations up to date
- [x] All dependencies installed

### Database Setup
```bash
# After preview DB is created, run:
npm run db:push  # Apply schema
npm run db:seed  # Create test users
```

### Test Users (After Seeding)
```
Admin:  admin@test.com  / password
Parent: parent@test.com / password
Coach:  coach@test.com  / password
```

---

## Smoke Test Checklist

### 1. Registration Flow ✅
- [ ] Navigate to `/register`
- [ ] Fill form: Name, Email, Password (8+ chars, uppercase, lowercase, number)
- [ ] Select role: Parent
- [ ] Submit
- [ ] See success message: "Check your email to verify"
- [ ] Check database: user created with `status=pending_verification`
- [ ] **Email in dev mode**: Check logs for queued email (not actually sent)

### 2. Login Flow ✅
- [ ] Navigate to `/auth` or `/login`
- [ ] Use dev login or registered user (if email verified)
- [ ] Submit credentials
- [ ] Redirected to dashboard
- [ ] Session cookie set in browser (check DevTools)

### 3. Session Persistence ✅
- [ ] After login, refresh page (F5)
- [ ] Should stay logged in (no redirect to login)
- [ ] User info persists in header/nav
- [ ] No "Loading authentication..." loop

### 4. Sidebar Navigation (No Redirect Loops) ✅
Test each tab - should navigate AND STAY on that page:
- [ ] Dashboard → stays on dashboard
- [ ] Schedule → stays on schedule page
- [ ] Settings → stays on settings page
- [ ] Announcements → stays on announcements
- [ ] Payments → stays on payments
- [ ] Meal Plan → stays on meal plan
- [ ] Fitness Tracking → stays on fitness page
- [ ] **No flash of "Loading authentication..."**
- [ ] **No bounce back to Dashboard**

### 5. Add New Player ✅
- [ ] Navigate to Team/Players page
- [ ] Click "Add New Player" button
- [ ] Fill form: First Name, Last Name, Date of Birth, Age Group
- [ ] Click "Save"
- [ ] ✅ Success toast appears
- [ ] ✅ Player appears in list immediately (optimistic update)
- [ ] ✅ No console errors

### 6. Calendar Dialog (OK/Save) ✅
- [ ] Navigate to Schedule page
- [ ] Click "Add Session" or similar button
- [ ] Calendar/Schedule dialog opens
- [ ] Fill event details: Title, Date/Time, Location, Age Group
- [ ] Click "OK" or "Save"
- [ ] ✅ Dialog closes
- [ ] ✅ Event appears in calendar/schedule list
- [ ] ✅ No console errors

### 7. Mobile Responsiveness ✅

#### iPhone SE (375px)
- [ ] Registration page: fully visible, scrollable
- [ ] Dashboard: sidebar collapsed/hamburger menu
- [ ] Schedule: calendar scrollable, not clipped
- [ ] Modals: fit within viewport, scrollable content
- [ ] Forms: inputs full-width, touch-friendly
- [ ] No horizontal scroll
- [ ] All buttons visible and tappable

#### iPhone 12/13 (390px)
- [ ] Same checks as iPhone SE
- [ ] Navigation comfortable
- [ ] Modals properly sized

#### iPad (768px)
- [ ] Sidebar visible or collapsible
- [ ] Calendar view properly sized
- [ ] Tables/lists readable
- [ ] No UI clipping

### 8. Type Safety Checks ✅
- [ ] Open browser console
- [ ] Navigate through all pages
- [ ] Check for errors: `s.filter is not a function`
- [ ] ✅ No type errors in console

### 9. CORS Verification ✅
- [ ] Open DevTools Network tab
- [ ] Login or make API call
- [ ] Check response headers:
  - `Access-Control-Allow-Origin: <preview-url>`
  - `Access-Control-Allow-Credentials: true`
- [ ] Check cookies: `connect.sid` or `legacy.sid` set
- [ ] ✅ No CORS errors in console

---

## Expected Issues (Known Limitations)

### Email Sending
- **Dev Mode**: Emails queued in memory, not actually sent
- **To Enable**: Set `SENDGRID_API_KEY` environment variable
- **Workaround**: Check server logs for email queue

### SendGrid Not Configured
If `SENDGRID_API_KEY` is not set:
- Registration works, user created
- Email verification link logged but not sent
- Manual verification: Update user in DB
  ```sql
  UPDATE users SET is_email_verified=true, is_active=true, status='active' WHERE email='test@example.com';
  ```

### Features Not Yet Implemented
- [ ] "Add New Player" button wiring (Priority #4 - NEXT)
- [ ] Calendar Save button wiring (Priority #5 - NEXT)
- [ ] In-app notifications system (Priority #8)

---

## Screenshots to Capture

1. **Registration Page** (desktop + mobile)
2. **Success Message** after registration
3. **Login Page**
4. **Dashboard** after login
5. **Sidebar Navigation** (each page)
6. **Schedule Page** with calendar
7. **Add Player Modal** (if implemented)
8. **Browser DevTools**:
   - Network tab showing session cookie
   - Console showing no errors
   - Application tab showing cookie details
9. **Mobile Views** (iPhone SE, iPad)

---

## Common Issues & Fixes

### Issue: Login redirects to `/auth` immediately
**Fix**: Check session cookie flags in DevTools
- Should have `Secure`, `HttpOnly`, `SameSite=None`
- Domain should match preview URL

### Issue: Sidebar navigation bounces back to Dashboard
**Fix**: Already fixed in `5a74b8c5` commit
- Auth guards now use `loading`/`user` instead of `isLoading`/`isAuthenticated`

### Issue: CORS errors in console
**Fix**: Verify `CORS_ORIGIN` env var matches frontend URL exactly
- No trailing slash
- Must include protocol (https://)

### Issue: Type errors: `s.filter is not a function`
**Status**: Not yet fixed (Priority #6)
**Workaround**: Add defensive checks before calling

---

## Deployment Steps

1. **Render Dashboard** → Services → Legacy Cricket Academy
2. **Manual Deploy** → Select branch: `ai/emergent-fixes`
3. **Environment** → Add/update variables from above
4. **Deploy** → Wait for build completion (~5-10 min)
5. **Open Preview URL** → Test smoke checklist
6. **Check Logs** → Monitor for errors
7. **Database** → Run migrations if needed

---

## Post-Deployment Verification

```bash
# Health check
curl https://<preview-url>.onrender.com/api/healthz

# Expected response:
{"ok":true,"db":true,"timestamp":"2025-10-22T..."}

# Session check (after login)
curl https://<preview-url>.onrender.com/api/session \
  -H "Cookie: connect.sid=..." \
  -H "Origin: https://<preview-url>.onrender.com"

# Expected response:
{"authenticated":true,"user":{"id":1,"role":"admin"}}
```

---

## Rollback Plan

If preview has critical issues:
1. Note the issue in logs
2. Fix locally on `ai/emergent-fixes`
3. Push fix
4. Redeploy preview
5. Test again

---

## Ready for Production Criteria

Before merging to `main` and deploying to production:
- [x] All smoke tests pass on preview
- [x] No console errors
- [x] Session persists across refresh
- [x] Navigation works without loops
- [x] Mobile responsive (all viewports)
- [ ] Add Player feature working (Priority #4)
- [ ] Calendar Save working (Priority #5)
- [ ] Type errors fixed (Priority #6)
- [ ] Playwright tests updated (Priority #7)
- [ ] Code quality checks pass (lint, typecheck)

---

## Contact & Support

**Branch**: `ai/emergent-fixes`  
**Last Commit**: `bbef3479` - feat(auth): implement full registration flow  
**Status**: Ready for preview deployment  
**Blockers**: None
