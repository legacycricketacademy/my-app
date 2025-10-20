# Production Verification Checklist

## Pre-Test Setup
1. Open Chrome DevTools (F12)
2. Go to Console tab - clear any existing logs
3. Go to Network tab - clear existing requests
4. Navigate to: https://cricket-academy-app.onrender.com/auth
5. Log in with admin credentials

## Page-by-Page Verification

### 1. /dashboard/schedule
- **URL**: https://cricket-academy-app.onrender.com/dashboard/schedule
- **Expected**: 
  - ✅ Page loads without JS errors
  - ✅ Shows "No sessions scheduled" empty state
  - ✅ "Add Session" button visible
- **Check Console**: Look for "DEBUG: upcomingSessions data is not an array:" logs
- **Check Network**: Verify `/api/sessions` returns 200 (not 401)

### 2. /dashboard/announcements  
- **URL**: https://cricket-academy-app.onrender.com/dashboard/announcements
- **Expected**:
  - ✅ Page loads without JS errors
  - ✅ Shows "No announcements yet" empty state
  - ✅ "Create Announcement" button visible
- **Check Console**: Look for "DEBUG: announcements data is not an array:" logs
- **Check Network**: Verify `/api/announcements` returns 200 (not 401)

### 3. /dashboard/fitness
- **URL**: https://cricket-academy-app.onrender.com/dashboard/fitness
- **Expected**:
  - ✅ Page loads without JS errors
  - ✅ Shows fitness tracking interface
  - ✅ "Log Activity" button visible
- **Check Console**: No filter-related errors
- **Check Network**: Verify `/api/fitness` returns 200 (not 401)

### 4. /dashboard/payments
- **URL**: https://cricket-academy-app.onrender.com/dashboard/payments
- **Expected**:
  - ✅ Page loads without JS errors
  - ✅ Shows "No payments recorded" empty state
  - ✅ "Record Payment" button visible
- **Check Console**: Look for "DEBUG: payments data is not an array:" logs
- **Check Network**: Verify `/api/payments` returns 200 (not 401)

### 5. /dashboard/team-management
- **URL**: https://cricket-academy-app.onrender.com/dashboard/team-management
- **Expected**:
  - ✅ Page loads without JS errors
  - ✅ Shows players table (empty or with data)
  - ✅ "Add New Player" button visible
- **Check Console**: Look for "DEBUG: players data is not an array:" logs
- **Check Network**: Verify `/api/players` returns 200 (not 401)

## Success Criteria
- ✅ No "TypeError: P.filter is not a function" errors
- ✅ No 401 Unauthorized errors in Network tab
- ✅ All pages show graceful empty states
- ✅ Debug logs show proper data types (arrays or helpful error info)

## If Issues Found
1. **401 Errors**: Session cookie not being sent - check CORS/session config
2. **Filter Errors**: Still getting non-array data - check API response shapes
3. **Blank Pages**: Component crashes - check console for other JS errors

## Quick Test Commands
```bash
# Test API endpoints directly
curl -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" https://cricket-academy-app.onrender.com/api/sessions
curl -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" https://cricket-academy-app.onrender.com/api/announcements
curl -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" https://cricket-academy-app.onrender.com/api/payments
```
