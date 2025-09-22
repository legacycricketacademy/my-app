import { test, expect } from '@playwright/test';

test('server is accessible', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.locator('h1')).toContainText('Legacy Cricket Academy');
});

test('auth page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/auth');
  await expect(page.locator('h1')).toContainText('Legacy Cricket Academy');
});

test('schedule page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/schedule');
  await expect(page.locator('h1')).toContainText('Schedule');
});
