// tests/e2e/settings.smoke.spec.ts
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.use({ storageState: 'playwright/.auth/admin.json' }); // pre-auth state

test('settings page loads and tabs work', async ({ page }) => {
  // Navigate to settings
  await page.goto(`${BASE}/dashboard/settings`);
  
  // Wait for settings page to load
  await expect(page.getByText('Settings', { exact: true })).toBeVisible({ timeout: 10000 });
  
  // Check that Profile tab is visible
  await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
  
  // Click on Notifications tab
  const notificationsButton = page.getByRole('button', { name: 'Notifications' });
  if (await notificationsButton.isVisible()) {
    await notificationsButton.click();
    await expect(page.getByText('Notifications', { exact: false })).toBeVisible();
  }
  
  // Click on Payments tab
  const paymentsButton = page.getByRole('button', { name: 'Payments' });
  if (await paymentsButton.isVisible()) {
    await paymentsButton.click();
    await expect(page.getByText('Payment Settings', { exact: false })).toBeVisible();
  }
});
