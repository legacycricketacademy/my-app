import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Clear storage state for fresh login
test.use({ storageState: { cookies: [], origins: [] } });

test('record payment opens modal and saves', async ({ page }) => {
  // Login
  await page.goto(`${BASE}/auth`);
  await page.getByPlaceholder(/email/i).fill(process.env.ADMIN_EMAIL || 'admin@test.com');
  await page.getByPlaceholder(/password/i).fill(process.env.ADMIN_PASSWORD || 'Test1234!');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for dashboard
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 15000 });

  // Navigate to payments
  await page.goto(`${BASE}/dashboard/payments`);
  await expect(page.getByRole('heading', { name: 'Payments', exact: true })).toBeVisible();

  // Click Record Payment button (use first() to avoid multiple matches)
  await page.getByRole('button', { name: /record payment/i }).first().click();

  // Wait for modal to open
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

  // Fill form
  await page.getByLabel(/player id/i).fill('player-1');
  await page.getByLabel(/^amount/i).fill('8500');

  // Click Save
  await page.getByRole('button', { name: /^save$/i }).click();

  // Wait for success toast
  await expect(page.getByText(/payment recorded/i)).toBeVisible({ timeout: 10000 });
});

