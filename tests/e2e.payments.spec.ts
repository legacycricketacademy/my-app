import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Clear storage state for fresh login
test.use({ storageState: { cookies: [], origins: [] } });

test('record payment flow', async ({ page }) => {
  // Login
  await page.goto(`${BASE}/auth`);
  await page.getByPlaceholder(/email/i).fill(process.env.ADMIN_EMAIL || 'admin@test.com');
  await page.getByPlaceholder(/password/i).fill(process.env.ADMIN_PASSWORD || 'password');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for dashboard
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 15000 });

  // Navigate to payments
  await page.goto(`${BASE}/dashboard/payments`);
  await expect(page.getByRole('heading', { name: 'Payments', exact: true })).toBeVisible();

  // Click Record Payment button
  await page.getByRole('button', { name: /record payment/i }).click();

  // Fill form
  await page.getByLabel(/player id/i).fill('player-1');
  await page.getByLabel(/player name/i).fill('Arjun Kumar');
  await page.getByLabel(/^amount/i).fill('8500');

  // Click Save
  await page.getByRole('button', { name: /^save$/i }).click();

  // Wait for success toast
  await expect(page.getByText(/payment recorded/i)).toBeVisible({ timeout: 10000 });
  
  // Verify payment appears in list
  await expect(page.getByText('Arjun Kumar')).toBeVisible();
  await expect(page.getByText('₹8500.00')).toBeVisible();
});

