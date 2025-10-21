# E2E Testing on Render - Complete Guide

## 📊 Current Status

**Environment:** `https://cricket-academy-app.onrender.com`  
**Last Run:** 27/65 passing (42% pass rate)

```
✅ 27 passing
❌ 37 failing  
🔄 1 flaky
⏭️ 1 skipped
```

---

## 🚀 How to Run Tests

### Against Render (Production)
```bash
BASE_URL=https://cricket-academy-app.onrender.com \
E2E_EMAIL=admin@test.com \
E2E_PASSWORD=password \
npx playwright test --reporter=line
```

### Locally
```bash
npm run dev  # In one terminal
npx playwright test --reporter=line  # In another
```

### Continuous Fix Loop
```bash
./scripts/continuous-e2e-fix.sh
```

---

## ✅ What's Been Fixed

### 1. Authentication System
**Problem:** Flaky UI form filling, sessions lost on deploy  
**Solution:** 
- API-based login using `/api/dev/login`
- PostgreSQL session store
- 30s timeout for Render cold starts

**Files Changed:**
- `tests/auth.setup.ts`
- `server/lib/sessionConfig.ts`
- `server/redirect.ts`

### 2. Database Schema
**Problem:** Missing tables, wrong column names  
**Solution:**
- Sequential table creation
- Migration logic
- Explicit schema naming (`public.users`)

**Files Changed:**
- `server/routes/dev-login.ts`

### 3. Client Error Handling
**Problem:** Pages crashed when API returned unexpected shapes  
**Solution:**
- Safe array extraction
- Handle `.data`, `.items`, or direct array
- Error states display properly

**Files Changed:**
- `client/src/pages/announcements-page.tsx`
- `client/src/pages/payments-page.tsx`
- `client/src/pages/schedule-page.tsx`

### 4. Test Quality
**Problem:** Strict mode violations, wrong selectors  
**Solution:**
- Use `exact: true` on headings
- Correct button text ("Create" not "New")
- Generous timeouts (15-30s)

**Files Changed:**
- `tests/smoke.spec.ts`
- `tests/announcements.e2e.spec.ts`

---

## ❌ What's Still Failing (37 tests)

### Common Symptom
**Every failure:** "Element not visible" or "Timeout waiting for [button/heading]"

### Root Cause Hypothesis
The pages **load** (smoke tests pass - headings visible), but **action buttons don't render**.

**Possible causes:**
1. **Layout Issue** - `DashboardLayout` might conditionally render children
2. **Role Check** - Buttons might only show for certain roles
3. **API Dependency** - Buttons might be hidden until data loads
4. **React Error** - Silent errors preventing full render

### Test Categories Affected

**E2E Flows (Interactive):**
- ✘ Announcements create (3)
- ✘ Payments record (5)
- ✘ Sessions create (2)
- ✘ Add player DOB (2)

**Navigation:**
- ✘ Dashboard nav (3)
- ✘ Parent portal (5)

**UI Components:**
- ✘ Modals & dialogs (5)
- ✘ Stripe payments (4)

**Pages:**
- ✘ Team page (1)
- ✘ Settings (1)
- ✘ Login flows (2)
- ✘ Auth display (1)

---

## 🔍 Debugging Guide

### Step-by-Step Investigation

#### 1. Run Test with Browser Visible
```bash
BASE_URL=https://cricket-academy-app.onrender.com \
npx playwright test tests/announcements.e2e.spec.ts:15 --headed --debug
```

#### 2. Check What's Actually Rendering
- Does the page show the heading? ✅
- Does the button exist in DOM? ❓
- Is the button visible (CSS check)? ❓
- Check browser console for errors ❓

#### 3. Test API Directly
```bash
# Login
curl -c /tmp/c.txt -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com"}' \
  https://cricket-academy-app.onrender.com/api/dev/login

# Test dependent APIs
curl -b /tmp/c.txt https://cricket-academy-app.onrender.com/api/announcements/recent
curl -b /tmp/c.txt https://cricket-academy-app.onrender.com/api/players
curl -b /tmp/c.txt https://cricket-academy-app.onrender.com/api/payments/pending
```

#### 4. Check Layouts
Add debug logging to:
- `client/src/layout/DashboardLayout.tsx`
- `client/src/layout/MainLayout.tsx`

```tsx
console.log('[LAYOUT] Rendering children:', !!children);
```

#### 5. Check Component Logic
In pages like `AnnouncementsPage.tsx`, add:
```tsx
console.log('[ANNOUNCEMENTS] Render state:', { isLoading, error, hasData: !!announcements });
```

### Common Fixes

**If button exists but isn't visible:**
```tsx
// Check CSS
<Button className="hidden md:block" /> // ❌ Hidden on mobile!
<Button /> // ✅ Always visible
```

**If button is behind permission check:**
```tsx
{user.role === 'admin' && <Button>Create</Button>} // Might need to check role
```

**If button is conditional on data:**
```tsx
{!isLoading && <Button>Create</Button>} // Make sure not stuck loading
```

---

## 📈 Progress History

| Date/Time | Passing | Failing | Pass Rate | Notes |
|-----------|---------|---------|-----------|-------|
| Initial | 16 | 46 | 25.8% | Before session |
| Mid-session | 28 | 36 | 43.8% | Peak |
| Final | 27 | 37 | 42.0% | Stable |

**Improvement:** +11 tests (+69%), +16.2 percentage points

---

## 🎯 Recommended Next Steps

### Immediate (1-2 hours)
1. **Debug announcements button** - Run headed, check DOM, fix rendering
2. **Debug team page** - Same process
3. **Fix settings tabs** - Check ARIA roles

### Short Term (4-6 hours)
4. Apply pattern to similar tests
5. Fix all "button not visible" failures
6. Test on Desktop + iPhone + Pixel

### Long Term
7. Add comprehensive test suite (players add/edit/delete, sessions, availability)
8. Add mobile layout tests
9. Add accessibility tests

---

## 📝 Key Files

### Tests
- `tests/auth.setup.ts` - Auth setup (works ✅)
- `tests/smoke.spec.ts` - Basic page loads (works ✅)
- `tests/announcements.e2e.spec.ts` - Announcements flows (failing ❌)
- `tests/payments.e2e.spec.ts` - Payment flows (failing ❌)
- `tests/sessions.create.spec.ts` - Session creation (failing ❌)

### Server
- `server/routes/dev-login.ts` - Dev login endpoint
- `server/redirect.ts` - Auth redirects
- `server/lib/sessionConfig.ts` - Session configuration

### Client
- `client/src/pages/dashboard/AnnouncementsPage.tsx` - Announcements UI
- `client/src/pages/dashboard/TeamPage.tsx` - Team/players UI
- `client/src/pages/dashboard/PaymentsPage.tsx` - Payments UI

---

## 🏁 Success Criteria

**Done when:**
- [ ] 65/65 tests passing
- [ ] 0 failures
- [ ] Tests pass on Desktop, iPhone 14 Pro, Pixel 7
- [ ] No flaky tests (run 3 times, all pass)

**Current:**
- [x] Auth infrastructure solid
- [x] Session persistence working
- [x] Database schema correct
- [x] 42% tests passing
- [ ] Remaining 37 tests need individual fixes

---

*Last updated: After continuous fixing session*  
*All changes committed to `main` branch*

