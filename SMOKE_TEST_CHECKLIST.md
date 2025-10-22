# Smoke Test Checklist for Preview Deployment

**Branch:** `ai/emergent-fixes`  
**Environment:** Preview (Render)  
**Date:** October 22, 2025

---

## Pre-Test Setup

### 1. Deploy to Render Preview
```bash
# In Render Dashboard
- Branch: ai/emergent-fixes
- Manual Deploy
- Wait ~5-10 minutes
```

### 2. Run Database Migrations
```bash
# In Render Shell (after deployment)
npm run db:push    # Apply Drizzle schema
npm run db:seed    # Create test users
```

**Expected Output:**
```
✅ Admin user created
✅ Parent user created
✅ Coach user created
Database seeding completed successfully!
```

### 3. Verify Test Users Created
```bash
# Optional: Check database
SELECT id, username, email, role FROM users;
```

**Test Credentials:**
- Admin: `admin@test.com` / `password`
- Parent: `parent@test.com` / `password`
- Coach: `coach@test.com` / `password`

---

## 🧪 Smoke Tests (MUST ALL PASS)

### Test 1: Registration Flow ✅
**Objective:** New users can register and receive verification email

**Steps:**
1. Navigate to preview URL `/register`
2. Fill form:
   - Full Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "Test1234!" (8+ chars, uppercase, lowercase, number)
   - Role: Parent
3. Click "Create Account"
4. Verify success message appears
5. Check server logs for verification email (dev mode - logged, not sent)

**Expected Results:**
- ✅ Form validates in real-time (password strength indicator)
- ✅ Success message: "Registration successful! Please check your email..."
- ✅ Redirects to login page after 3 seconds
- ✅ User created in database with `status=pending_verification`
- ✅ Email logged in server (if SENDGRID_API_KEY not set)

**Screenshot Needed:** Registration form + success message

---

### Test 2: Login + Auto-Login After Registration ✅
**Objective:** Users can log in and session persists

**Steps:**
1. Navigate to `/auth` or `/login`
2. Enter credentials: `admin@test.com` / `password`
3. Click "Log In"
4. Should redirect to dashboard
5. Check browser DevTools → Application → Cookies
6. Verify cookie `connect.sid` or `legacy.sid` is set

**Expected Results:**
- ✅ Login succeeds without errors
- ✅ Redirected to `/dashboard` or `/admin`
- ✅ Session cookie set with:
  - `HttpOnly: true`
  - `Secure: true` (production)
  - `SameSite: None` (production)
  - Domain: `.onrender.com` or preview domain
- ✅ User info displayed in header/navbar

**Screenshot Needed:** Dashboard after login + DevTools cookies

---

### Test 3: Session Persistence (Refresh) ✅
**Objective:** Session survives page refresh

**Steps:**
1. After successful login, press F5 (refresh page)
2. Should stay logged in
3. Refresh 2-3 more times
4. Navigate to different page, then refresh again

**Expected Results:**
- ✅ No redirect to login page
- ✅ User remains authenticated
- ✅ No "Loading authentication..." loop
- ✅ No console errors
- ✅ Cookie persists across refreshes

**Screenshot Needed:** Network tab showing session cookie sent with requests

---

### Test 4: Sidebar Navigation (No Redirect Loops) ✅
**Objective:** All sidebar tabs stay on their page without bouncing

**Test Each Tab:**
1. Dashboard → Click → **Stays on Dashboard**
2. Schedule → Click → **Stays on Schedule page**
3. Settings → Click → **Stays on Settings page**
4. Team/Players → Click → **Stays on Team page**
5. Announcements → Click → **Stays on Announcements page**
6. Payments → Click → **Stays on Payments page**
7. Meal Plan → Click → **Stays on Meal Plan page**
8. Fitness Tracking → Click → **Stays on Fitness page**

**Expected Results for Each:**
- ✅ Page loads and stays loaded
- ✅ No flash of "Loading authentication..."
- ✅ No automatic redirect back to Dashboard
- ✅ URL changes to correct route
- ✅ Content displays properly
- ✅ No console errors

**Screenshot Needed:** Each sidebar page (at least 3-4 key ones)

---

### Test 5: Add New Player → Save → Appears in List ✅
**Objective:** Coach/Admin can add players successfully

**Steps:**
1. Login as admin or coach
2. Navigate to Team/Players page
3. Click "Add New Player" button
4. Fill form:
   - First Name: "Test"
   - Last Name: "Player"
   - Date of Birth: "2010-01-15"
   - Age Group: "Under 14s"
   - Player Type: "All-rounder"
   - Parent Name: "Test Parent"
   - Parent Email: "parent@test.com"
5. Click "Save Player" button
6. Dialog should close
7. Check players list

**Expected Results:**
- ✅ Form validates (required fields)
- ✅ Submit button shows loading state ("Saving...")
- ✅ Success toast appears: "Player added successfully"
- ✅ Dialog closes automatically
- ✅ New player appears in list immediately (optimistic update)
- ✅ Player data persists after page refresh
- ✅ No console errors

**Screenshot Needed:** Add Player form + player list with new entry

---

### Test 6: Calendar Dialog OK/Save → Event Created ✅
**Objective:** Schedule/session can be created and appears in calendar

**Steps:**
1. Login as admin or coach
2. Navigate to Schedule page
3. Click "Add Session" or similar button
4. Calendar/Schedule dialog opens
5. Fill event details:
   - Title: "Test Training Session"
   - Start Date/Time: Tomorrow at 10:00 AM
   - End Date/Time: Tomorrow at 12:00 PM
   - Location: "Main Field"
   - Age Group: "Under 14s"
   - Max Attendees: 20
6. Click "Save" or "OK"
7. Dialog should close
8. Check calendar/schedule list

**Expected Results:**
- ✅ Form validates (start < end time)
- ✅ Submit button shows loading state
- ✅ Success toast appears: "Session created"
- ✅ Dialog closes automatically
- ✅ Event appears in calendar immediately
- ✅ Event data persists after page refresh
- ✅ No console errors

**Screenshot Needed:** Schedule dialog + calendar with new event

---

### Test 7: Mobile Responsiveness ✅

#### iPhone SE (375px width)
**Steps:**
1. Open Chrome DevTools
2. Toggle Device Toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Select "iPhone SE"
4. Test all pages

**Expected Results:**
- ✅ Registration page: Fully visible, scrollable, no horizontal scroll
- ✅ Login page: Form fits viewport, touch-friendly
- ✅ Dashboard: Sidebar collapses to hamburger menu
- ✅ Schedule page: Calendar scrollable, not clipped
- ✅ Modals/Dialogs:
  - Fit within viewport
  - Content scrollable with `overflow-y: auto`
  - Close button visible and tappable
  - Save button visible (not hidden below fold)
- ✅ Forms: Inputs full-width, comfortable tap targets (44px min)
- ✅ Tables/Lists: Horizontal scroll if needed, or stacked layout
- ✅ No UI elements clipped or cut off
- ✅ All buttons reachable and tappable

#### iPhone 12/13 (390px width)
**Steps:**
- Same as iPhone SE
- Verify comfortable spacing

**Expected Results:**
- ✅ Same as iPhone SE
- ✅ Slightly more breathing room

#### iPad (768px width)
**Steps:**
- Test in landscape and portrait
- Verify layout adapts

**Expected Results:**
- ✅ Sidebar visible or collapsible
- ✅ Calendar view properly sized
- ✅ Tables readable with proper column widths
- ✅ Forms comfortable with 2-column layouts
- ✅ No awkward gaps or compressed layouts

**Screenshots Needed:**
- Registration on iPhone SE
- Dashboard on iPhone 12
- Schedule dialog on iPad
- Any modal/dialog showing scrollable content

---

### Test 8: CORS & Network Verification ✅
**Objective:** Verify CORS headers and cookie handling

**Steps:**
1. Open Chrome DevTools → Network tab
2. Login or make any API call
3. Click on a request (e.g., `/api/session`)
4. Check Response Headers
5. Check Request Headers

**Expected Response Headers:**
```
Access-Control-Allow-Origin: https://<preview-url>.onrender.com
Access-Control-Allow-Credentials: true
Set-Cookie: connect.sid=s%3A...; Domain=.onrender.com; Path=/; HttpOnly; Secure; SameSite=None
```

**Expected Request Headers:**
```
Cookie: connect.sid=s%3A...
Origin: https://<preview-url>.onrender.com
```

**Expected Results:**
- ✅ No CORS errors in console
- ✅ Cookie sent with every request
- ✅ Response headers allow credentials
- ✅ Origin matches preview URL

**Screenshot Needed:** Network tab showing headers

---

### Test 9: Console Error Check ✅
**Objective:** Verify no JavaScript errors

**Steps:**
1. Open Chrome DevTools → Console
2. Navigate through all pages
3. Perform all CRUD operations (create player, session, etc.)
4. Watch for errors

**Expected Results:**
- ✅ No red errors in console
- ✅ No "s.filter is not a function" errors
- ✅ No uncaught exceptions
- ✅ Warnings acceptable (React, library warnings OK)

**Screenshot Needed:** Clean console or any errors found

---

### Test 10: Email Verification (Dev Mode) ⏳
**Objective:** Verify email system is ready (even in dev mode)

**Steps:**
1. Register a new user
2. Check Render logs: `View Logs` → search for "email"
3. Look for verification token and URL

**Expected in Dev Mode (no SENDGRID_API_KEY):**
- ✅ Email queued but not sent
- ✅ Verification URL logged
- ✅ Token generated and stored in database
- ✅ `/api/auth/verify-email?token=...` endpoint exists

**With SENDGRID_API_KEY (optional):**
- ✅ Email actually sent to inbox
- ✅ Clicking link verifies account
- ✅ User status changes to `active`

**Screenshot Needed:** Server logs showing email queue

---

## 🚫 Known Limitations (Not Blockers)

### 1. Email Sending (Dev Mode)
- Emails logged but not sent without SENDGRID_API_KEY
- Workaround: Manually update user status in database
- Not a blocker for preview testing

### 2. Type Errors (s.filter) - Fixed
- Added defensive `Array.isArray()` checks in players-page.tsx
- Should not appear in console

### 3. Features Pending Implementation
- ⏳ In-app notifications system (Priority #8)
- ⏳ Advanced meal plan features
- ⏳ Fitness tracking analytics

---

## 📊 Pass/Fail Criteria

### MUST PASS (Blockers for Production)
- [ ] Test 1: Registration ✅
- [ ] Test 2: Login ✅
- [ ] Test 3: Session Persistence ✅
- [ ] Test 4: Sidebar Navigation (no loops) ✅
- [ ] Test 5: Add Player works ✅
- [ ] Test 6: Calendar Save works ✅
- [ ] Test 7: Mobile responsive ✅
- [ ] Test 8: CORS/Cookies correct ✅
- [ ] Test 9: No console errors ✅

### NICE TO HAVE (Not Blockers)
- [ ] Test 10: Email sending (can be dev mode)
- [ ] Playwright E2E tests green
- [ ] Performance: Pages load < 3 seconds

---

## 🐛 Issue Reporting Template

If a test fails, report using this format:

```
### Issue: [Test Name] Failed

**Test:** Test #X - [Name]
**Severity:** Critical / High / Medium / Low
**Browser:** Chrome 120 / Safari 17 / Firefox 121
**Device:** Desktop / iPhone SE / iPad

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected:**
- ...

**Actual:**
- ...

**Screenshot:**
[Attach screenshot]

**Console Errors:**
```
[Paste console errors]
```

**Network Tab:**
[Any failed requests]
```

---

## ✅ Sign-Off

After completing all tests:

- [ ] All MUST PASS tests passed
- [ ] Screenshots captured for documentation
- [ ] No critical console errors
- [ ] Mobile responsive verified
- [ ] Ready for production deployment

**Tested By:** _______________  
**Date:** _______________  
**Preview URL:** _______________  
**Approval:** [ ] PASS → Proceed to production  
                [ ] FAIL → Fix issues and retest
