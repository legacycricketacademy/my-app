import { test, expect } from '@playwright/test';

// These come from environment variables (set in CI via GitHub Secrets)
const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'Test1234!';

test('bootstrap auth and save storage state', async ({ page }) => {
  console.log('🔵 Starting auth setup...');
  
  // Navigate to login page
  await page.goto('/auth', { waitUntil: 'networkidle' });
  console.log('✅ Navigated to /auth');

  // Fill in credentials
  const emailInput = page.getByPlaceholder(/email/i);
  const passwordInput = page.getByPlaceholder(/password/i);
  const signInButton = page.getByRole('button', { name: /sign in/i });
  
  await emailInput.fill(email);
  await passwordInput.fill(password);
  console.log(`✅ Filled credentials: ${email}`);
  
  // Click sign in
  await signInButton.click();
  console.log('✅ Clicked sign in');

  // Wait for navigation away from /auth
  await page.waitForURL(url => !url.pathname.includes('/auth'), { timeout: 15000 });
  console.log('✅ Navigated away from /auth, current URL:', page.url());
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check we're on dashboard or parent dashboard
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  
  // Wait for any dashboard content to appear
  const dashboardIndicators = [
    page.getByRole('heading', { name: /dashboard/i }),
    page.getByRole('heading', { name: /team management/i }),
    page.getByRole('heading', { name: /schedule/i }),
    page.locator('main'),
    page.locator('[class*="dashboard"]'),
  ];
  
  // Wait for at least one indicator to be visible
  let found = false;
  for (const indicator of dashboardIndicators) {
    try {
      await indicator.waitFor({ state: 'visible', timeout: 2000 });
      console.log('✅ Found dashboard indicator');
      found = true;
      break;
    } catch (e) {
      // Try next indicator
    }
  }
  
  if (!found) {
    console.log('⚠️ No dashboard indicators found, but continuing anyway');
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/auth-setup-final-state.png', fullPage: true });
  }

  // Persist session for subsequent tests
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  console.log('✅ Saved storage state to playwright/.auth/admin.json');
});
