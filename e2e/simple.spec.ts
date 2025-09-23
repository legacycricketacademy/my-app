import { test, expect } from '@playwright/test';

test('server is accessible', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // The app redirects to /auth, so check for the auth page content
  await expect(page).toHaveURL('http://localhost:3000/auth');
  await expect(page.locator('text=Legacy Cricket Academy')).toBeVisible();
});

test('auth page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/auth');
  await expect(page.locator('text=Legacy Cricket Academy')).toBeVisible();
  await expect(page.locator('text=Sign in to your account')).toBeVisible();
});

test('schedule page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/schedule');
  // The app redirects to /auth for unauthenticated users
  await expect(page).toHaveURL('http://localhost:3000/auth');
  await expect(page.locator('text=Legacy Cricket Academy')).toBeVisible();
});
