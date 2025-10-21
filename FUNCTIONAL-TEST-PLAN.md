# Functional E2E Test Plan - Beyond Smoke Tests

**Date:** October 21, 2025  
**Current Status:** Smoke tests 100% passing (11/11), Expanding to functional suite  
**Total Tests:** 65 tests  
**Smoke Tests Passing:** 11/11 ✅  
**Functional Tests:** 54 remaining

---

## 📊 Current Test Results (Max Failures = 5)

### ✅ Passing (2):
- Auth setup (flaky but passes on retry)
- Unknown test (need full run to identify)

### ❌ Failing (7):
1. **Announcements E2E** (3 tests)
   - Create announcement and display
   - Validate announcement form fields
   - Character count for announcement body

2. **Add Player DOB** (2 tests)
   - Add New Player with Date of Birth picker
   - DOB picker prevents future date selection

3. **Auth Spec** (1 test)
   - Display login page with development accounts

4. **Debug Schedule Button** (1 test)
   - Login and check schedule button

### ⏸️ Did Not Run (56):
- Stopped after 7 failures due to `--max-failures=5` flag
- Need full run to assess all tests

---

## 🎯 Test Categories (User Priority)

### 1. **Parent Payment Flows** (High Priority)
Tests for parent-facing payment functionality:
- View pending payments
- Make payments via Stripe
- Payment confirmation
- Payment history
- Receipt generation

**Expected Test Files:**
- `tests/e2e/payments.spec.ts`
- `tests/stripe.payment.spec.ts` ✅ (exists)
- `tests/e2e.payments.spec.ts` ✅ (exists)

### 2. **Session CRUD** (High Priority)
Full lifecycle testing for training sessions:
- **Create:** Add new sessions with title, age group, location, times
- **Read:** View session list, session details
- **Update:** Edit existing sessions
- **Delete:** Remove sessions
- **Validation:** Required fields, date ranges, capacity limits

**Expected Test Files:**
- `tests/sessions.create.spec.ts` ✅ (exists)
- `tests/e2e/sessions.ok-button.spec.ts` ✅ (exists)
- Need: sessions.update.spec.ts, sessions.delete.spec.ts

### 3. **Meal Plan CRUD & Validation** (High Priority)
- Create meal plans
- Update meal plans
- Delete meal plans
- Validation: nutritional requirements, dietary restrictions
- File uploads (meal plan PDFs/images)

**Expected Test Files:**
- Need to create meal-plans.spec.ts

### 4. **Fitness CRUD & Validation** (High Priority)
- Create fitness assessments
- Update fitness records
- Delete fitness data
- Validation: metrics, dates, player assignments

**Expected Test Files:**
- Need to create fitness.spec.ts

---

## 🔍 Detailed Failure Analysis

### 1. Announcements E2E Failures (3 tests)

**Common Pattern:** All 3 announcement tests failing  
**Likely Root Cause:** Button selector or modal rendering issue

**Test File:** `tests/announcements.e2e.spec.ts`

**Investigation Needed:**
- Is "Create Announcement" button visible?
- Is the modal/dialog opening correctly?
- Are form fields rendering?
- Character counter implementation

**Quick Fix Strategy:**
1. Check if button text changed (was "New Announcement", now "Create Announcement")
2. Verify modal is using `<dialog>` element or different container
3. Update selectors to match current UI

### 2. Add Player DOB Failures (2 tests)

**Error:** `Team Management` heading not visible  
**File:** `tests/e2e/add-player.dob.spec.ts`

**Root Cause:** Page not loading or routing issue

**Error Details:**
```
TimeoutError: expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: 'Team Management', exact: true })
```

**Investigation Needed:**
- Is `/dashboard/team` accessible?
- Does heading exist with exact text "Team Management"?
- Is there an auth/redirect issue?

**Quick Fix:**
- Navigate to page with longer timeout
- Check for loading states
- Verify user has access to team management

### 3. Auth Page - Development Accounts

**Error:** `Development Accounts` section not visible  
**File:** `tests/e2e/auth.spec.ts`

**Root Cause:** UI feature missing or changed

**Likely Issue:**
- Development accounts section may not be shown in production
- May need `VITE_ENABLE_DEV_LOGIN` flag to show
- UI may have changed

**Quick Fix:**
- Check if dev accounts only show in development mode
- Skip test in production OR update UI to always show dev accounts when `VITE_ENABLE_DEV_LOGIN=true`

### 4. Debug Schedule Button

**File:** `tests/debug-schedule-button.spec.ts`

**Note:** This is a debug test, likely can be removed or fixed separately

---

## 📋 Action Plan

### Phase 1: Quick Wins (Current Failures)
1. ✅ Fix auth setup retry logic (DONE)
2. ⬜ Fix announcements tests (button selectors)
3. ⬜ Fix add player tests (page loading)
4. ⬜ Fix auth page test (dev accounts visibility)
5. ⬜ Remove/fix debug test

### Phase 2: Run Full Suite
1. ⬜ Run all 65 tests without `--max-failures`
2. ⬜ Categorize all failures by type
3. ⬜ Identify patterns (selector issues, timeout issues, API issues)

### Phase 3: Focus on Priority Features

#### A. Parent Payment Flows
- [ ] List all payment-related test files
- [ ] Run payment tests in isolation
- [ ] Fix payment flow issues
- [ ] Verify Stripe integration (test mode)
- [ ] Test payment success/failure scenarios

#### B. Session CRUD
- [ ] Verify create session tests pass
- [ ] Add update session tests
- [ ] Add delete session tests
- [ ] Test validation rules
- [ ] Test date/time handling
- [ ] Test capacity limits

#### C. Meal Plans CRUD
- [ ] Create meal-plans.spec.ts
- [ ] Test create meal plan
- [ ] Test update meal plan
- [ ] Test delete meal plan
- [ ] Test file uploads
- [ ] Test validation

#### D. Fitness CRUD
- [ ] Create fitness.spec.ts
- [ ] Test create fitness assessment
- [ ] Test update fitness records
- [ ] Test delete fitness data
- [ ] Test metrics validation

---

## 🛠️ Testing Strategy

### Test File Organization

```
tests/
├── smoke.spec.ts ✅ (11/11 passing)
├── auth.setup.ts ✅ (passing with retry)
├── announcements.e2e.spec.ts ❌ (3 failing)
├── e2e/
│   ├── add-player.dob.spec.ts ❌ (2 failing)
│   ├── auth.spec.ts ❌ (1 failing)
│   ├── sessions.ok-button.spec.ts ✅
│   ├── settings.smoke.spec.ts
│   ├── add-player.dob.spec.ts
│   └── ... (more to discover)
├── sessions.create.spec.ts ✅
├── stripe.payment.spec.ts
├── e2e.payments.spec.ts
├── e2e.announcements.spec.ts
└── ... (more to discover)
```

### Priority Order
1. **Fix existing failures** (7 tests)
2. **Run full suite** to discover all tests
3. **Payment flows** (user priority #1)
4. **Session CRUD** (user priority #2)
5. **Meal plans** (user priority #3)
6. **Fitness** (user priority #4)

---

## 📈 Success Metrics

### Current
- Smoke Tests: 100% (11/11) ✅
- Functional Tests: ~3% (2/65) ❌
- Overall: ~20% (13/65)

### Target (End of Session)
- Smoke Tests: 100% ✅
- Payment Flows: 80%+
- Session CRUD: 80%+
- Meal Plans: 80%+
- Fitness: 80%+
- Overall: 60%+

---

## 🚀 Next Steps

1. **Immediate:** Fix the 7 failing tests
2. **Short-term:** Run full suite without max-failures
3. **Medium-term:** Focus on payment flows
4. **Long-term:** Complete all CRUD tests for priority features

---

**Ready to proceed with Phase 1: Quick Wins!**

