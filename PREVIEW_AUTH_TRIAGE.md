# Preview Auth Triage Instructions

## Issue
Login fails on Render preview deployment.

## Diagnostic Commit
Commit: `98f9e6de` - Added diagnostics and cookie domain fix

---

## A) Quick Triage Steps

### 1. Push Latest Fix to GitHub

```bash
cd /app/legacy-cricket-academy
GITHUB_TOKEN="your_token_here"
git push https://$GITHUB_TOKEN@github.com/legacycricketacademy/my-app.git ai/emergent-fixes --force-with-lease
```

### 2. Redeploy Preview on Render

- Go to Render dashboard
- Select service
- Manual Deploy → Branch: `ai/emergent-fixes`
- Wait for deployment (~5 minutes)

### 3. Check Server Logs

In Render logs, look for:
```
🔧 Auth Configuration: {
  NODE_ENV: 'production',
  CORS_ORIGIN: 'https://...',
  COOKIE_DOMAIN: '(not set - browser default)',
  trustProxy: 1,
  sessionCookie: { ... }
}

🔧 Session Cookie Config: {
  name: 'sid',
  secure: true,
  sameSite: 'none',
  domain: '(browser default - recommended for preview)',
  httpOnly: true,
  maxAge: '7 days'
}
```

**Expected values:**
- NODE_ENV: `production`
- CORS_ORIGIN: Should match your frontend URL EXACTLY
- trustProxy: `1`
- secure: `true`
- sameSite: `none`

### 4. Test with Curl Script

```bash
# Set your preview URL
export BASE_URL=https://cricket-academy-app.onrender.com

# Run test script
./test-auth-preview.sh

# Or manually:
curl -i -X POST "$BASE_URL/api/dev/login" \
  -H "Content-Type: application/json" \
  -H "Origin: $BASE_URL" \
  -d '{"email":"admin@test.com","password":"password"}' \
  -c /tmp/cookies.txt
```

**Check for Set-Cookie header:**
```
Set-Cookie: sid=s%3A...; Path=/; Expires=...; HttpOnly; Secure; SameSite=None
```

### 5. Verify Cookie is Sent Back

```bash
curl -i "$BASE_URL/api/session" \
  -H "Origin: $BASE_URL" \
  -b /tmp/cookies.txt
```

**Expected:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "role": "admin"
  }
}
```

### 6. Use Diagnostic Endpoints

```bash
# Check server config
curl "$BASE_URL/api/diag/config" | jq .

# Check headers and session
curl "$BASE_URL/api/diag/headers" \
  -b /tmp/cookies.txt | jq .
```

---

## B) Most Likely Causes & Fixes

### Issue #1: CORS_ORIGIN Mismatch ❌

**Symptom:** No Set-Cookie header in response

**Check:**
```bash
# Server logs should show:
CORS_ORIGIN: 'https://cricket-academy-app.onrender.com'
```

**Fix:**
- Set CORS_ORIGIN to EXACT preview URL
- No trailing slash
- Must include protocol (https://)

**Environment Variable:**
```
CORS_ORIGIN=https://cricket-academy-app.onrender.com
```

### Issue #2: Cookie Domain Misconfigured ❌

**Symptom:** Cookie set but not sent on subsequent requests

**Our Fix:** Omit domain entirely (let browser use host default)

**Before (broken):**
```
COOKIE_DOMAIN=.onrender.com
```

**After (fixed):**
```
# Leave COOKIE_DOMAIN empty or unset
# SESSION_COOKIE_DOMAIN=
```

**Why:** Preview might be on different subdomain

### Issue #3: Trust Proxy Not Set ❌

**Check server code:**
```typescript
app.set("trust proxy", 1); // ✅ Line 62 in index.ts
```

**This is already set!** ✅

### Issue #4: Secure Cookie Without HTTPS ❌

**Preview MUST use HTTPS**

**Check:**
- URL starts with `https://` ✅
- Render provides HTTPS by default ✅

### Issue #5: Frontend Not Sending Credentials ❌

**Check client code:**
```typescript
// Should be in every API call
fetch('/api/endpoint', {
  credentials: 'include'  // ✅ Already added
})
```

**Already fixed in:** `fetchJson` helper

---

## C) Browser DevTools Testing

### 1. Open Preview in Browser

Navigate to: `https://cricket-academy-app.onrender.com/auth`

### 2. Open DevTools (F12)

Go to **Network** tab

### 3. Filter by XHR/Fetch

Click "XHR" button in Network tab

### 4. Attempt Login

- Email: `admin@test.com`
- Password: `password`
- Click "Log In"

### 5. Check Login Request

Click on the `/api/dev/login` request

**Response Headers:** Look for:
```
Set-Cookie: sid=s%3A...; Path=/; HttpOnly; Secure; SameSite=None
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://cricket-academy-app.onrender.com
```

**If Set-Cookie is MISSING:**
- Check server logs for CORS_ORIGIN
- Verify trust proxy is 1
- Check NODE_ENV=production

### 6. Check Subsequent Request

Click on next API request (e.g., `/api/session`)

**Request Headers:** Look for:
```
Cookie: sid=s%3A...
```

**If Cookie is MISSING:**
- Cookie domain might be wrong
- SameSite might be blocking
- Browser might be blocking third-party cookies

---

## D) Environment Variables Checklist

### Required for Preview:

```bash
# Critical
NODE_ENV=production
PORT=10000
DATABASE_URL=<from Render>
SESSION_SECRET=<long random string>
CORS_ORIGIN=https://cricket-academy-app.onrender.com

# DO NOT SET (let browser use default):
# SESSION_COOKIE_DOMAIN=

# Session cookie name
SESSION_COOKIE_NAME=sid

# Optional
ENABLE_DIAGNOSTICS=true  # For debugging
ENABLE_DEV_LOGIN=false   # Use real login on preview
```

### What Changed:

**Before (broken):**
```bash
SESSION_COOKIE_DOMAIN=.onrender.com  # Too broad
COOKIE_DOMAIN=cricket-academy-app.onrender.com  # Might mismatch
```

**After (fixed):**
```bash
# Leave empty - let browser handle it
SESSION_COOKIE_DOMAIN=
COOKIE_DOMAIN=
```

---

## E) Run E2E Tests

### After Auth is Fixed:

```bash
# Install Playwright browsers (if not installed)
npx playwright install chromium

# Run tests against preview
BASE_URL=https://cricket-academy-app.onrender.com npm run test:e2e

# Or just auth tests
BASE_URL=https://cricket-academy-app.onrender.com \
  npx playwright test tests/auth.login.spec.ts --project=chromium

# View report
npx playwright show-report
```

### Expected Results:

```
✅ auth.login.spec.ts - 8/8 passed
✅ auth.registration.spec.ts - 7/7 passed
✅ nav.sidebar.spec.ts - 10/10 passed
⏳ players.add.spec.ts
⏳ schedule.crud.spec.ts
```

---

## F) Common Fixes

### Fix #1: Remove COOKIE_DOMAIN

**In Render Dashboard:**
1. Go to Environment variables
2. Find `SESSION_COOKIE_DOMAIN` or `COOKIE_DOMAIN`
3. **Delete them** (don't just clear - remove entirely)
4. Redeploy

### Fix #2: Verify CORS_ORIGIN

**In Render Dashboard:**
1. Check `CORS_ORIGIN` value
2. Should be: `https://cricket-academy-app.onrender.com`
3. **Exact match, no trailing slash**
4. If wrong, update and redeploy

### Fix #3: Check Trust Proxy in Logs

**Look for startup log:**
```
🔧 Auth Configuration: {
  ...
  trustProxy: 1  // Must be 1
}
```

**If not present:** Already in code (line 62)

### Fix #4: Enable Diagnostics

**Add to environment:**
```
ENABLE_DIAGNOSTICS=true
```

**Then access:**
```
https://cricket-academy-app.onrender.com/api/diag/config
https://cricket-academy-app.onrender.com/api/diag/headers
```

---

## G) Screenshots to Capture

### 1. Login Response Headers
- Network tab → `/api/dev/login` → Response Headers
- Look for `Set-Cookie` line
- Screenshot entire headers section

### 2. Session Request Headers
- Network tab → `/api/session` → Request Headers  
- Look for `Cookie` line
- Screenshot entire headers section

### 3. Diagnostic Output
- Navigate to `/api/diag/headers`
- Screenshot the JSON response

### 4. Server Logs
- Render dashboard → Logs
- Look for startup configuration
- Screenshot the config section

---

## H) What to Share

After testing, please share:

1. **Curl Output:**
```bash
# Login response with headers
curl -i -X POST "$BASE_URL/api/dev/login" ...

# Session check
curl -i "$BASE_URL/api/session" -b /tmp/cookies.txt
```

2. **Set-Cookie Header Line:**
```
Set-Cookie: sid=s%3A...; Path=/; HttpOnly; Secure; SameSite=None
```

3. **E2E Test Summary:**
```
Tests: 8 passed, 0 failed
Time: 30s
```

4. **Network Screenshot:**
- Showing cookie in request headers

---

## I) Expected Fix

The cookie domain fix should resolve the issue:

**Root Cause:** Cookie domain was set to `.onrender.com` or specific subdomain, causing browser to reject it

**Solution:** Omit domain entirely, let browser use the host's domain

**Code Change:**
```typescript
// Before
cookie: { domain: COOKIE_DOMAIN }

// After  
cookie: { ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}) }
```

**Result:** Cookie uses preview host automatically ✅

---

## J) If Still Broken

Try these in order:

1. **Clear all cookies in browser** (Settings → Privacy → Clear cookies)
2. **Try incognito/private window**
3. **Check if HTTPS** (URL starts with https://)
4. **Verify backend and frontend on same domain** (not separate subdomains)
5. **Check Render service settings** (Web Service, not Static Site)
6. **Try different browser** (Chrome, Firefox, Safari)

If none work, share:
- Diagnostic endpoint output
- Server logs (startup section)
- Network screenshots
- Curl outputs

---

**Status: Ready to Test** ✅  
**Commit: 98f9e6de**  
**Branch: ai/emergent-fixes**
