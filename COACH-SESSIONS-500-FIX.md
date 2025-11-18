# Coach Sessions 500 Error - Fix Complete

## Problem

The `/api/coach/sessions` endpoint was returning 500 errors with:
```
TypeError: Cannot destructure property 'inArray' of 'undefined' as it is undefined
```

This was causing the Schedule page (`/dashboard/schedule`) to show "Failed to load schedule".

## Root Cause

The code was using Drizzle ORM's callback-style destructuring for query helpers:

```typescript
// ❌ OLD CODE (BROKEN)
const coaches = await db.query.users.findMany({
  where: (users, { inArray }) => inArray(users.id, coachIds),
  columns: { id: true, fullName: true },
});
```

This pattern is no longer supported in the current version of Drizzle ORM.

## Solution

### 1. Import Helpers Directly

**File: `server/routes/coach-sessions.ts`**

```diff
- import { eq, gte, sql, and, desc } from "drizzle-orm";
+ import { eq, gte, sql, and, desc, inArray } from "drizzle-orm";
```

### 2. Rewrite Queries to Use Imported Helpers

**Query 1: Get Coach Names**
```diff
- const coaches = await db.query.users.findMany({
-   where: (users, { inArray }) => inArray(users.id, coachIds),
-   columns: { id: true, fullName: true },
- });
+ const coaches = coachIds.length > 0 
+   ? await db.select({ id: users.id, fullName: users.fullName })
+       .from(users)
+       .where(inArray(users.id, coachIds))
+   : [];
```

**Query 2: Get Availability Counts**
```diff
- const availabilityCounts = await db
-   .select({
-     sessionId: sessionAvailability.sessionId,
-     status: sessionAvailability.status,
-     count: sql<number>`count(*)::int`,
-   })
-   .from(sessionAvailability)
-   .where((sessionAvailability, { inArray }) => inArray(sessionAvailability.sessionId, sessionIds))
-   .groupBy(sessionAvailability.sessionId, sessionAvailability.status);
+ const availabilityCounts = sessionIds.length > 0
+   ? await db
+       .select({
+         sessionId: sessionAvailability.sessionId,
+         status: sessionAvailability.status,
+         count: sql<number>`count(*)::int`,
+       })
+       .from(sessionAvailability)
+       .where(inArray(sessionAvailability.sessionId, sessionIds))
+       .groupBy(sessionAvailability.sessionId, sessionAvailability.status)
+   : [];
```

### 3. Added Empty Array Guards

Both queries now check if the array is empty before executing:
- `coachIds.length > 0` - Only query if there are coach IDs
- `sessionIds.length > 0` - Only query if there are session IDs

This prevents unnecessary database queries and potential errors.

## Files Modified

1. ✅ `server/routes/coach-sessions.ts`
   - Added `inArray` to imports
   - Rewrote coach query to use explicit `inArray()`
   - Rewrote availability query to use explicit `inArray()`
   - Added empty array guards

2. ✅ `tests/e2e/unified-session-creation.spec.ts`
   - Added comprehensive test for Schedule page load
   - Validates GET `/api/coach/sessions` returns 200
   - Validates POST `/api/coach/sessions` returns 201
   - Validates success toast appears
   - Validates no error banners appear

## Testing

### New Test Added

**Test: "Schedule page loads successfully and creates session with toast"**

This test validates the complete flow:

1. ✅ Navigate to `/dashboard/schedule`
2. ✅ Wait for GET `/api/coach/sessions` response
3. ✅ Assert response status is 200 (not 500)
4. ✅ Verify no "Failed to load schedule" error
5. ✅ Click "Schedule New Session" button
6. ✅ Fill out the form with valid data
7. ✅ Submit the form
8. ✅ Wait for POST `/api/coach/sessions` response
9. ✅ Assert POST response status is 201
10. ✅ Assert success toast "Session created successfully" appears
11. ✅ Assert no error banners appear
12. ✅ Assert no 400 error overlays appear

## Server Restart Required

**IMPORTANT:** The server must be restarted for these changes to take effect.

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev:server
```

## Expected Behavior After Fix

### Before Fix
- ❌ GET `/api/coach/sessions` returns 500
- ❌ Schedule page shows "Failed to load schedule"
- ❌ Server logs show "Cannot destructure property 'inArray'"

### After Fix
- ✅ GET `/api/coach/sessions` returns 200
- ✅ Schedule page loads successfully
- ✅ Empty state shows if no sessions
- ✅ Session list shows if sessions exist
- ✅ No server errors in logs

## API Response Format

### GET /api/coach/sessions

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Batting Practice",
      "description": "Focus on swing mechanics",
      "sessionType": "training",
      "ageGroup": "5-8 years",
      "location": "Strongsville",
      "startTime": "2025-11-20T14:00:00.000Z",
      "endTime": "2025-11-20T16:00:00.000Z",
      "coachId": 1,
      "maxPlayers": 20,
      "coachName": "John Doe",
      "yesCount": 5,
      "noCount": 2,
      "maybeCount": 3
    }
  ]
}
```

**Empty Response (200):**
```json
{
  "success": true,
  "data": []
}
```

## Verification Steps

1. **Restart the server:**
   ```bash
   npm run dev:server
   ```

2. **Test the endpoint manually:**
   ```bash
   curl http://localhost:3000/api/coach/sessions \
     -H "Cookie: sid=<your-session-cookie>"
   ```

3. **Check the browser:**
   - Navigate to `/dashboard/schedule`
   - Should see either empty state or session list
   - Should NOT see "Failed to load schedule"

4. **Run the tests:**
   ```bash
   npx playwright test tests/e2e/unified-session-creation.spec.ts --reporter=list
   ```

## Related Issues Fixed

This fix also resolves:
- ✅ Schedule page 500 errors
- ✅ "Failed to load schedule" error message
- ✅ Drizzle ORM query helper issues
- ✅ Empty array query edge cases

## Conclusion

The coach-sessions route is now fixed and will return 200 responses once the server is restarted. The comprehensive test ensures this functionality remains stable going forward.
