# Testing Guide - Login Fix

## Quick Start

### 1. Start the Backend Server

```bash
npm run dev:server
```

Wait for the server to start. You should see:
```
[express] listening on 3002
✅ Using memory session store (development or PG not available)
```

### 2. Run the Test Script

In a **new terminal**:

```bash
node test-login.js
```

Expected output:
```
🧪 Testing Login Flow
============================================================

1️⃣  Testing health endpoint...
   Status: 200
   Response: { status: 'ok', env: 'development', port: 3002, ... }

2️⃣  Testing login with admin@test.com...
   Status: 200
   Response: { success: true, message: 'Login successful', data: { user: { id: 1, email: 'admin@test.com', role: 'admin' } } }
   Cookies: [ 'sid=...; Path=/; HttpOnly; SameSite=Lax' ]
   ✅ Session cookie received

3️⃣  Testing /api/user with session cookie...
   Status: 200
   Response: { success: true, data: { id: 1, email: 'admin@test.com', role: 'admin', fullName: 'Admin User' } }
   ✅ User authenticated successfully!

4️⃣  Testing /api/session/me with session cookie...
   Status: 200
   Response: { success: true, authenticated: true, user: { id: 1, email: 'admin@test.com', role: 'admin' } }

5️⃣  Testing logout...
   Status: 200
   Response: { ok: true }

6️⃣  Testing /api/user after logout...
   Status: 401
   Response: { success: false, message: 'Not authenticated' }
   ✅ Session cleared successfully!

============================================================
✅ All tests completed!
```

### 3. Test in Browser

#### Option A: Using the Frontend

1. Start the full dev server:
   ```bash
   npm run dev
   ```

2. Open browser to `http://localhost:5173`

3. Navigate to login page (usually `/auth/login` or `/login`)

4. Login with test credentials:
   - **Admin**: `admin@test.com` / `password`
   - **Parent**: `parent@test.com` / `password`

5. Should redirect to dashboard

#### Option B: Using Browser DevTools

1. Open browser to `http://localhost:3002`

2. Open DevTools Console (F12)

3. Run this code:

```javascript
// Test login
fetch('http://localhost:3002/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'password'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Login response:', data);
  
  // Test authenticated endpoint
  return fetch('http://localhost:3002/api/user', {
    credentials: 'include'
  });
})
.then(r => r.json())
.then(data => console.log('User data:', data))
.catch(err => console.error('Error:', err));
```

Expected console output:
```
Login response: { success: true, message: "Login successful", data: { user: { id: 1, email: "admin@test.com", role: "admin" } } }
User data: { success: true, data: { id: 1, email: "admin@test.com", role: "admin", fullName: "Admin User" } }
```

## Manual API Testing with curl

### 1. Health Check
```bash
curl http://localhost:3002/health
```

### 2. Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}' \
  -c cookies.txt \
  -v
```

### 3. Get User Info (with session)
```bash
curl http://localhost:3002/api/user \
  -b cookies.txt \
  -v
```

### 4. Logout
```bash
curl -X POST http://localhost:3002/api/auth/logout \
  -b cookies.txt \
  -v
```

## Troubleshooting

### Server won't start
- Check if port 3002 is already in use: `lsof -i :3002`
- Kill existing process: `kill -9 <PID>`
- Check `.env.local` exists and has `SESSION_SECRET`

### Login returns 401
- Verify credentials: `admin@test.com` / `password` or `parent@test.com` / `password`
- Check server logs for error messages
- Verify session middleware is loaded (check server startup logs)

### Session not persisting
- Check cookies in browser DevTools (Application > Cookies)
- Verify `credentials: 'include'` in fetch requests
- Check CORS settings allow credentials
- Verify `SESSION_SECRET` is set in `.env.local`

### CORS errors in browser
- Verify frontend is running on `http://localhost:5173`
- Check `CORS_ORIGIN` in `.env.local` matches frontend URL
- Ensure `credentials: 'include'` in all fetch requests

### Test script fails
- Ensure server is running on port 3002
- Check server logs for errors
- Try running with more verbose output: `node test-login.js 2>&1 | tee test-output.log`

## Debug Endpoints

These endpoints help diagnose issues:

### Check Session
```bash
curl http://localhost:3002/api/_debug/session -b cookies.txt
```

### Check Cookies
```bash
curl http://localhost:3002/api/_debug/cookie -c cookies.txt -v
```

### Quick Auth Check
```bash
curl http://localhost:3002/api/_whoami -b cookies.txt
```

## Environment Variables

Make sure these are set in `.env.local`:

```bash
SESSION_SECRET=dev-secret-key-change-in-production-12345
SESSION_COOKIE_NAME=sid
CORS_ORIGIN=http://localhost:5173
PORT=3002
NODE_ENV=development
ENABLE_DEV_LOGIN=true
```

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Test login in browser
3. ✅ Test logout in browser
4. ✅ Verify session persists across page refreshes
5. ⏳ Test with real database users (not just test accounts)
6. ⏳ Test role-based access control
7. ⏳ Test on production environment

## Getting Help

If tests fail:

1. Check server logs for errors
2. Check browser console for errors
3. Verify environment variables are set
4. Review `LOGIN-FIX-SUMMARY.md` for detailed information
5. Check that you're on the `fix/login-authentication-flow` branch

## Success Criteria

✅ Test script completes without errors
✅ Login returns 200 with user data
✅ Session cookie is set
✅ `/api/user` returns user data with session
✅ Logout clears session
✅ Browser login works and redirects to dashboard
✅ Session persists across page refreshes
