import { test, expect } from '@playwright/test';

// These come from environment variables (set in CI via GitHub Secrets)
const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'Test1234!';

test('bootstrap auth and save storage state', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth');

  // Fill in credentials
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  
  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for dashboard to appear (server sets session cookie)
  await expect(page.locator('text=/dashboard|welcome/i')).toBeVisible({ timeout: 15000 });

  // Persist session for subsequent tests
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
