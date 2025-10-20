import { test, expect } from '@playwright/test';

// These come from environment variables (set in CI via GitHub Secrets)
const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'Test1234!';

test('bootstrap auth and save storage state', async ({ page }) => {
  console.log('🔵 Starting auth setup with:', email);
  
  // Navigate to login page
  await page.goto('/auth', { waitUntil: 'networkidle' });
  console.log('✅ On login page');

  // Fill in credentials
  const emailInput = page.getByPlaceholder(/email/i);
  const passwordInput = page.getByPlaceholder(/password/i);
  const signInButton = page.getByRole('button', { name: /sign in/i });
  
  await emailInput.fill(email);
  await passwordInput.fill(password);
  console.log('✅ Filled credentials');
  
  // Click sign in
  await signInButton.click();
  console.log('✅ Clicked sign in');

  // Wait for navigation away from /auth (more reliable than looking for specific heading)
  await page.waitForURL(url => !url.pathname.includes('/auth'), { timeout: 15000 });
  console.log('✅ Navigated away from /auth to:', page.url());
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Wait for any main content to appear (dashboard, sidebar, main element, etc.)
  const contentIndicators = [
    page.locator('main'),
    page.locator('aside'),
    page.locator('[role="main"]'),
    page.getByRole('heading', { name: /dashboard|schedule|team/i }),
  ];
  
  // Try each indicator with a short timeout
  let foundContent = false;
  for (const indicator of contentIndicators) {
    try {
      await indicator.first().waitFor({ state: 'visible', timeout: 2000 });
      console.log('✅ Found content indicator');
      foundContent = true;
      break;
    } catch {
      // Try next indicator
    }
  }
  
  if (!foundContent) {
    console.log('⚠️ No content indicators found, taking screenshot');
    await page.screenshot({ path: 'test-results/auth-setup-state.png', fullPage: true });
  }

  console.log('✅ Saving storage state');
  // Persist session for subsequent tests
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  console.log('✅ Auth setup complete!');
});
