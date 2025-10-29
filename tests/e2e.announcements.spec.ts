import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Clear storage state for fresh login
test.use({ storageState: { cookies: [], origins: [] } });

test('create announcement flow', async ({ page }) => {
  // Login
  await page.goto(`${BASE}/auth`);
  await page.getByPlaceholder(/email/i).fill(process.env.ADMIN_EMAIL || 'admin@test.com');
  await page.getByPlaceholder(/password/i).fill(process.env.ADMIN_PASSWORD || 'password');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for dashboard
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 15000 });

  // Navigate to announcements
  await page.goto(`${BASE}/dashboard/announcements`);
  await expect(page.getByRole('heading', { name: 'Announcements', exact: true })).toBeVisible();

  // Click Create Announcement button
  await page.getByRole('button', { name: /create announcement/i }).click();

  // Fill form
  await page.getByLabel(/^title/i).fill('Match Reminder');
  await page.getByLabel(/message/i).fill('Important match on Saturday at 4pm. Please arrive 30 minutes early.');

  // Click Create
  await page.getByRole('button', { name: /^create$/i }).click();

  // Wait for success toast
  await expect(page.getByText(/announcement created/i)).toBeVisible({ timeout: 10000 });
  
  // Verify announcement appears in list
  await expect(page.getByText('Match Reminder')).toBeVisible();
  await expect(page.getByText(/important match on saturday/i)).toBeVisible();
});

