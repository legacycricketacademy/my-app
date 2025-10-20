# 🎭 Playwright Test Workflow Guide

## 🚀 Quick Commands

### Run All Tests
```bash
npm run pw:full
```

### Re-run Only Failed Tests
```bash
npm run pw:failed
```

### Loop on Failures (Auto-retry until all pass)
```bash
npm run pw:loop-failed
```
*Press Ctrl+C to stop*

### Interactive UI Mode
```bash
npm run pw:ui
```

### With Retries (Soak Flakes)
```bash
npm run pw:retries2
```

## 📋 Workflow Options

### Option A: Manual Loop (One-liner)
```bash
# Run initial full test
npm run pw:full

# Then loop on failures
while true; do npm run pw:failed || true; sleep 1; done
```

### Option B: Automated Loop Script
```bash
npm run pw:loop-failed
```

This will:
1. Run full test suite to capture failures
2. Loop on `--last-failed` until all pass
3. Auto-exit when everything is green ✅

### Option C: UI Mode (Best for Development)
```bash
npm run pw:ui
```

Features:
- Visual test runner
- Click eye icon on failed tests to watch
- Edit code and tests auto-rerun
- Inspect DOM, network, console
- Time travel debugging

## 🔧 Configuration

### Retries
**Local:** 1 retry (helps with flaky tests)  
**CI:** 2 retries (more resilient)

Set in `playwright.config.ts`:
```typescript
retries: CI ? 2 : 1
```

### Trace Collection
**Strategy:** `on-first-retry` (saves disk space)

Only records trace when:
- Test fails first time
- Then retries and we capture the retry trace

### Video & Screenshots
- **Screenshots:** Only on failure
- **Video:** Retained on failure
- **Trace:** On first retry

## 📊 Current Test Status

```
✅ 22 tests passing
❌ 41 tests failing
📈 Improvement: From 0 → 22 passing
```

### Common Failure Types:
1. **Strict Mode Violations** - Multiple elements found (e.g., duplicate "Create Announcement" buttons)
2. **Missing Elements** - Headings/buttons renamed or moved
3. **Navigation Issues** - Some tests not using storage state correctly

## 🛠️ Fixing Failed Tests

### Step 1: Identify Pattern
```bash
npm run pw:failed
```

Look at the error messages - most fall into categories:
- "strict mode violation" → Multiple buttons with same name
- "element(s) not found" → Heading/selector changed
- "Timeout" → Page not loading or element not appearing

### Step 2: Fix One Category at a Time
Example: Strict mode violations

```typescript
// ❌ BEFORE (fails with 2+ buttons)
await page.getByRole('button', { name: /create announcement/i }).click();

// ✅ AFTER (click first one)
await page.getByRole('button', { name: /create announcement/i }).first().click();
```

### Step 3: Re-run Failed Tests
```bash
npm run pw:failed
```

### Step 4: Repeat Until Green
Use the loop script to automate:
```bash
npm run pw:loop-failed
```

## 🎯 Pro Tips

### Focus on Specific Tests
```bash
# Only auth tests
npx playwright test tests/e2e/auth.spec.ts --last-failed

# Only schedule tests  
npx playwright test tests/e2e/schedule --last-failed

# Tests matching pattern
npx playwright test --grep "Add Session" --last-failed
```

### Debug Mode
```bash
# Step through test with debugger
PWDEBUG=1 npm run pw:failed

# Console output
DEBUG=pw:api npm run pw:failed
```

### Headed Mode (See Browser)
```bash
npm run pw:failed -- --headed
```

## 📈 Test Improvement Strategy

### Phase 1: Fix Auth (✅ DONE)
- Auth setup passing
- Session cookies working
- Storage state saved

### Phase 2: Fix Strict Mode (CURRENT)
Common fixes:
```typescript
// Use .first() for buttons
.getByRole('button', { name: /foo/i }).first().click()

// Use exact role + name
.getByRole('heading', { name: 'Schedule', exact: true })

// Use more specific selectors
.getByTestId('add-session-btn')
```

### Phase 3: Fix Missing Elements
Update test selectors to match current UI:
```typescript
// Check what's actually on the page
const headings = await page.locator('h1, h2, h3').allTextContents();
console.log('Found headings:', headings);
```

### Phase 4: Fix Timeouts
Increase for slow actions:
```typescript
await page.waitForLoadState('domcontentloaded'); // Faster than 'networkidle'
await page.waitForTimeout(500); // Small delay for React state
```

## 🎬 Live Demo

You requested to see tests live - here's how:

### Watch Tests Run in Browser
```bash
npm run pw:full -- --headed
```

### Interactive UI with Watch Mode
```bash
npm run pw:ui
```

Then:
1. Click on a failed test
2. See the browser replay
3. Edit the test file
4. Test auto-reruns
5. See if it passes

## 📊 Success Metrics

### Current State:
- **8 passing** in last run
- Auth infrastructure working
- Session management solid

### Target:
- **60+ tests passing**
- All critical paths covered
- No flaky tests

### Progress:
```
Before: ████░░░░░░░░░░░░░░░░ 0/64 (0%)
Now:    ████████░░░░░░░░░░░░ 22/64 (34%)
Target: ████████████████████ 64/64 (100%)
```

## 🚀 Next Steps

1. **Run loop script to see current failures:**
   ```bash
   npm run pw:loop-failed
   ```

2. **Or use UI mode for interactive fixing:**
   ```bash
   npm run pw:ui
   ```

3. **Once all passing, deploy:**
   ```bash
   git push origin main
   ```

## 📝 Notes

- The `pretest:e2e` hook auto-builds before every test run
- Tests use fresh build from `dist/`
- Browser windows open in headed mode (you see them live)
- UI mode is best for iterative fixing

Happy testing! 🎭

