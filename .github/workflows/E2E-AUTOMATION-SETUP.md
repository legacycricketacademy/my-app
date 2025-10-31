# E2E Automation Setup Guide

This guide explains how to set up automatic E2E test execution and email notifications after Render deployments.

## 🔄 How It Works

1. **Render Deploys** → Server boots → Calls `notifyGithubOnBoot()` function
2. **GitHub Receives** → `repository_dispatch` event → Triggers `.github/workflows/e2e-production.yml`
3. **Tests Run** → Playwright E2E tests (mobile + desktop) → Generate summary
4. **Email Sent** → Summary sent to `dude.dudetap001@gmail.com` via Gmail SMTP

## ✅ Setup Steps

### 1. Enable GitHub Dispatch from Render

Set these environment variables in Render dashboard:

```bash
GH_OWNER=legacycricketacademy
GH_REPO=my-app
GH_PAT=<your-github-pat>
```

**To create a GitHub PAT:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Scopes needed:
   - `repo` (full control of private repositories)
   - Or use fine-grained token with:
     - Repository access: `legacycricketacademy/my-app`
     - Permissions: `Actions: Write`

### 2. Enable Email Notifications

Set these secrets in GitHub repository:

1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `GMAIL_USER`: Your Gmail address (e.g., `your-email@gmail.com`)
   - `GMAIL_PASS`: Gmail App Password (NOT your regular password)

**To get Gmail App Password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Security → 2-Step Verification → App passwords
4. Generate app password for "Mail"
5. Copy the 16-character password → Use as `GMAIL_PASS`

### 3. Verify Workflow Triggers

The workflow triggers automatically on:
- ✅ Push to `deploy/render-staging` branch
- ✅ `repository_dispatch` event (from Render server boot)
- ✅ Manual trigger via GitHub Actions UI

## 🧪 Testing the Automation

### Manual Trigger

```bash
gh workflow run "E2E Tests on Render (with Email Summary)" \
  --ref deploy/render-staging
```

Or via GitHub UI:
1. Go to Actions → "E2E Tests on Render (with Email Summary)"
2. Click "Run workflow"
3. Select branch: `deploy/render-staging`
4. Click "Run workflow"

### Verify Email Delivery

After a workflow run:
1. Check GitHub Actions logs for "✅ Email sent successfully"
2. Check your inbox: `dude.dudetap001@gmail.com`
3. Subject will be:
   - `✅ E2E Test Success` (if all tests pass)
   - `❌ E2E Test Failures` (if any tests fail)

## 📧 Email Content

The email includes:
- Test summary (pass/fail status)
- Duration
- Viewports tested (mobile + desktop)
- Failure details (if any)
- Link to GitHub Actions artifacts

## 🔍 Troubleshooting

### Email not sending?

1. **Check GitHub Secrets:**
   ```bash
   # In GitHub UI, verify secrets exist:
   # Settings → Secrets and variables → Actions
   # - GMAIL_USER ✅
   # - GMAIL_PASS ✅
   ```

2. **Verify Gmail App Password:**
   - Must be 16 characters
   - Must use App Password, not regular password
   - 2FA must be enabled

3. **Check workflow logs:**
   - GitHub Actions → Workflow run → "Send email summary" step
   - Look for error messages

### GitHub dispatch not working?

1. **Check Render environment variables:**
   ```bash
   GH_OWNER=legacycricketacademy  # ✅
   GH_REPO=my-app                  # ✅
   GH_PAT=ghp_...                  # ✅ (must be valid)
   ```

2. **Check server logs:**
   - Render logs should show: `[gh-dispatch] sent repository_dispatch to GitHub`
   - If missing, PAT may be invalid or lack permissions

3. **Manual test:**
   ```bash
   curl -X POST https://api.github.com/repos/legacycricketacademy/my-app/dispatches \
     -H "Authorization: token YOUR_PAT" \
     -H "Accept: application/vnd.github+json" \
     -d '{"event_type":"render_deploy_succeeded"}'
   ```

### Tests not running?

1. **Check workflow trigger:**
   - Ensure branch is `deploy/render-staging`
   - Check if workflow file exists: `.github/workflows/e2e-production.yml`

2. **Check Render deployment:**
   - Verify service is healthy: `curl https://cricket-academy-app.onrender.com/api/ping`
   - Check Render logs for dispatch confirmation

## 🎯 Expected Behavior

**On every Render deployment:**
1. Server starts → `notifyGithubOnBoot()` runs
2. GitHub Actions workflow triggers automatically
3. Tests run against `https://cricket-academy-app.onrender.com`
4. Summary email sent to `dude.dudetap001@gmail.com`
5. Artifacts uploaded to GitHub Actions

**No manual steps required** after initial setup! 🚀

