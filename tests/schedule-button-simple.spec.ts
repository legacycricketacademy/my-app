import { test, expect } from '@playwright/test';

// Use stored auth if available, otherwise skip auth
test.use({ storageState: 'playwright/.auth/admin.json' });

test('Add Session button opens modal', async ({ page }) => {
  // Go to schedule page
  await page.goto('/dashboard/schedule', { waitUntil: 'networkidle' });
  
  // Check current URL
  console.log('Current URL:', page.url());
  
  // If redirected to /auth, skip this test
  if (page.url().includes('/auth')) {
    test.skip();
    return;
  }
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Look for the Schedule heading
  const scheduleHeading = page.getByRole('heading', { name: /schedule/i });
  await expect(scheduleHeading).toBeVisible({ timeout: 5000 });
  
  // Look for Add Session button
  const addSessionButton = page.getByRole('button', { name: /add session/i }).first();
  await expect(addSessionButton).toBeVisible();
  
  console.log('✅ Found Add Session button');
  
  // Click the button
  await addSessionButton.click();
  
  // Wait a moment for modal to appear
  await page.waitForTimeout(500);
  
  // Check for modal heading
  const modalHeading = page.getByRole('heading', { name: /schedule new session/i });
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/modal-test.png', fullPage: true });
  
  // Assert modal is visible
  await expect(modalHeading).toBeVisible({ timeout: 3000 });
  
  console.log('✅ Modal opened successfully!');
});

