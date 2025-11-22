# Coach Scheduling Tests - Fixed and Hardened

## Summary
Successfully updated and hardened the Coach Scheduling E2E tests to work with the current unified Schedule Session dialog and modern auth flow.

## Changes Made

### 1. Added Test IDs to Components

#### `client/src/pages/coach/CoachSchedule.tsx`
- Added `data-testid="coach-schedule-page"` to main container
- Added `data-testid="upcoming-sessions-card"` to sessions card
- Added `data-testid="upcoming-sessions-list"` to sessions list container
- Added `data-testid="loading-sessions"` to loading state
- Added `data-testid="no-sessions"` to empty state
- Added `data-testid="session-card-{id}"` to each session card

#### `client/src/components/sessions/schedule-session-dialog.tsx`
- Added `data-testid="create-session-btn"` to the button that opens the dialog
- Added `data-testid="input-session-title"` to the title input field
- Added `data-testid="btn-submit-session"` to the submit button

### 2. Updated Tests (`tests/coach-sessions.e2e.spec.ts`)

#### Auth Flow
- **Removed manual login** - Tests now use the admin storage state from `auth.setup.ts`
- This eliminates redirect issues and makes tests faster and more reliable

#### Selector Updates
- Replaced brittle CSS selectors with stable `data-testid` attributes
- Used role-based queries where appropriate (e.g., `getByRole("heading")`)
- Updated all tests to match the current unified dialog structure

#### Test Coverage
1. **coach can access schedule page and see form**
   - Verifies page loads with correct test IDs
   - Checks for create session button
   - Validates upcoming sessions section exists

2. **coach can view upcoming sessions list**
   - Verifies sessions list is visible
   - Handles both empty state and populated list scenarios
   - Uses test IDs to check for session cards

3. **coach can open session creation dialog**
   - Clicks the create session button
   - Verifies dialog opens with title field visible
   - Checks for submit button presence

4. **form validation requires title**
   - Opens the dialog
   - Attempts to submit without filling required fields
   - Verifies validation prevents submission (dialog stays open)

## Test Results

```bash
npx playwright test tests/coach-sessions.e2e.spec.ts --project=chromium --reporter=list
```

**Status: ✅ All tests passing**

```
✓ [setup] › tests/auth.setup.ts:6:1 › bootstrap auth and save storage state (2.6s)
✓ [chromium] › tests/coach-sessions.e2e.spec.ts:4:3 › Coach Session Management › coach can access schedule page and see form (4.2s)
✓ [chromium] › tests/coach-sessions.e2e.spec.ts:24:3 › Coach Session Management › coach can view upcoming sessions list (4.2s)
✓ [chromium] › tests/coach-sessions.e2e.spec.ts:49:3 › Coach Session Management › coach can open session creation dialog (4.6s)
✓ [chromium] › tests/coach-sessions.e2e.spec.ts:72:3 › Coach Session Management › form validation requires title (5.4s)

5 passed (11.0s)
```

## Benefits

1. **Stability** - Test IDs provide stable selectors that won't break with CSS changes
2. **Speed** - Using auth storage state eliminates redundant login steps
3. **Maintainability** - Clear, descriptive test IDs make tests easy to understand
4. **Reliability** - Tests now accurately reflect the current UI structure

## Files Modified

- `client/src/pages/coach/CoachSchedule.tsx` - Added test IDs
- `client/src/components/sessions/schedule-session-dialog.tsx` - Added test IDs
- `tests/coach-sessions.e2e.spec.ts` - Complete rewrite with modern selectors and auth

## Next Steps (Optional)

- Add mobile-specific test coverage for coach schedule
- Add E2E test for successful session creation flow
- Add test for session editing/deletion (when implemented)
