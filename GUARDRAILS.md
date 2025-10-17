# Production Guardrails & CI/CD Safety Nets

This document describes the guardrails implemented to prevent production crashes and catch issues before deployment.

---

## 🛡️ Implemented Guardrails

### 1. CI Smoke Test (`.github/workflows/ci-smoke.yml`)

**Purpose**: Catches build and boot failures before merge

**What it does**:
- ✅ Builds the full project (client + server)
- ✅ Verifies critical dependency exports with `scripts/check-exports.js`
- ✅ Boots the actual server bundle (like Render does)
- ✅ Waits for health check endpoint to respond
- ✅ Verifies server is responding correctly

**Triggers**: Every PR and push to `main`

**Impact**: **BLOCKS MERGE** if server won't boot or responds with errors

---

### 2. Export Verification Script (`scripts/check-exports.js`)

**Purpose**: Ensures critical dependencies export what we need at runtime

**What it checks**:
- ✅ `date-fns-tz` exports `fromZonedTime` (v3 API)
- ✅ Other critical dependencies as needed

**Why this matters**:
- Prevents "Cannot find export" crashes on Render
- Catches API breaking changes in dependencies
- Runs in CI before build

**Usage**:
```bash
node scripts/check-exports.js
```

---

### 3. Post-Deploy E2E Tests (`.github/workflows/e2e-postdeploy.yml`)

**Purpose**: Validates live deployment automatically after Render deploys

**What it does**:
- ✅ Triggered by Render via webhook (repository_dispatch)
- ✅ Waits for Render app to be healthy (up to 4 minutes)
- ✅ Runs full Playwright E2E suite against live deployment
- ✅ Uploads test report artifacts
- ✅ Comments on PR with results (if applicable)

**Setup Required**:

1. **Add Render Post-Deploy Hook**:
   ```bash
   # In Render Dashboard > Service > Environment
   # Add: GITHUB_PAT (with repo scope)
   
   # In Render Dashboard > Service > Settings > Build & Deploy
   # Post-Deploy Command:
   curl -X POST \
     -H "Accept: application/vnd.github+json" \
     -H "Authorization: Bearer $GITHUB_PAT" \
     https://api.github.com/repos/legacycricketacademy/my-app/dispatches \
     -d '{"event_type":"render_deployed"}'
   ```

2. **Create GitHub PAT**:
   - Go to GitHub Settings > Developer settings > Personal Access Tokens
   - Create token with `repo` scope
   - Add to Render environment as `GITHUB_PAT`

**Manual Trigger**:
```bash
# Can also trigger manually from GitHub Actions UI
# Actions > E2E (post-deploy live) > Run workflow
```

---

### 4. Health Check Endpoints

**Debug Echo** (`/api/_debug/echo`):
- Returns server status, auth state, cookies
- Used by CI smoke test
- Used by Render health checks

**Response format**:
```json
{
  "ok": true,
  "method": "GET",
  "url": "/api/_debug/echo",
  "hasUser": false,
  "cookies": [],
  "headers": {
    "origin": "...",
    "cookie": "[present]"
  }
}
```

**Recommended Render Settings**:
- Health Check Path: `/api/_debug/echo`
- Auto-Rollback: Enabled (if plan supports)

---

### 5. Branch Protection Rules (Recommended)

Protect `main` branch in GitHub:

1. **Go to**: Settings > Branches > Add rule

2. **Enable**:
   - ✅ Require status checks to pass before merging
   - ✅ Required checks:
     - `build-and-boot` (from ci-smoke.yml)
     - `e2e` (from e2e-on-push.yml)
   - ✅ Require branches to be up to date
   - ✅ Do not allow bypassing the above settings

---

## 📊 Safety Net Coverage

| Issue Type | Caught By | When |
|------------|-----------|------|
| Build failures | CI Smoke | Before merge |
| Missing exports | Export Check | Before merge |
| Server boot crash | CI Smoke | Before merge |
| API endpoint errors | CI Smoke | Before merge |
| E2E test failures | E2E on Push | After merge |
| Production regressions | Post-Deploy E2E | After Render deploy |

---

## 🚨 What Caused the Original Render Crash

**Problem**: `utcToZonedTime` from `date-fns-tz` was imported but not used, causing runtime errors on Render

**Root Cause**: 
- date-fns-tz v3 changed API: `utcToZonedTime` → `toZonedTime`
- Server was importing old v2 function name
- Local dev worked (maybe cached or different node version)
- Render failed because it does clean installs

**Fix**:
1. ✅ Removed `utcToZonedTime` import (never used anyway)
2. ✅ Updated to use v3 API: `fromZonedTime` (was `zonedTimeToUtc`)
3. ✅ Server only converts local→UTC, never UTC→local
4. ✅ Client handles all timezone display formatting

---

## 🔧 Dependency Management

### Critical Dependencies

**date-fns-tz**: `^3.2.0`
- Used for: Converting local time to UTC
- API: `fromZonedTime(localTime, timezone)` → UTC Date
- ⚠️ Do NOT use `toZonedTime` on server (client only)

### Recommended Practices

1. **Pin major versions** for critical libs:
   ```json
   "date-fns-tz": "^3.2.0"  // ✅ v3.x.x
   ```

2. **Use Renovate or Dependabot**:
   - Auto-creates PRs for updates
   - CI must pass before merge
   - Catches breaking changes early

3. **Review dependency updates carefully**:
   - Check for API changes
   - Update export checks if needed
   - Test locally before merging

---

## 🎯 Quick Reference

### Run Checks Locally

```bash
# Export check
node scripts/check-exports.js

# Build
npm run build

# Boot server (like Render)
PORT=3000 NODE_ENV=production SESSION_SECRET=test node dist/index.js

# E2E against local
BASE_URL=http://localhost:3000 ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=Test1234! npx playwright test

# E2E against Render
npm run e2e:live
```

### Fix Common Issues

**Server won't boot**:
1. Check logs: `npm run build && node dist/index.js`
2. Check exports: `node scripts/check-exports.js`
3. Check environment vars

**CI failing**:
1. Run locally first
2. Check GitHub Actions logs
3. Verify dependencies installed correctly

**E2E failing**:
1. Check if Render is actually deployed
2. Wait for health check: `npx wait-on https://cricket-academy-app.onrender.com/api/_debug/echo`
3. Run locally to isolate issue

---

## 📝 Maintenance

### When Adding New Critical Dependencies

1. Add export check to `scripts/check-exports.js`
2. Document usage in this file
3. Test in CI before merging

### When Updating Major Dependencies

1. Review changelog for breaking changes
2. Update export checks if APIs changed
3. Test locally thoroughly
4. Monitor post-deploy E2E

### When Modifying Guardrails

1. Update this documentation
2. Test the guardrail catches actual issues
3. Consider impact on development speed vs safety

---

## ✅ Success Criteria

A healthy production deployment should:
- ✅ Pass CI smoke test
- ✅ Pass export verification
- ✅ Boot successfully on Render
- ✅ Respond to health checks within 30s
- ✅ Pass E2E tests on push
- ✅ Pass post-deploy E2E tests

If ANY of these fail → **DO NOT DEPLOY** until fixed.

---

## 🙏 Credits

These guardrails were implemented after a production incident where `date-fns-tz` v3 API changes caused a Render crash. They are designed to catch similar issues in CI before they reach production.

