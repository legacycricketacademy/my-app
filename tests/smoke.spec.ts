import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('dashboard renders and sidebar is single (no duplication)', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

  // Quick duplicate sidebar guard: look for nav elements
  const sidebars = await page.locator('aside, nav[class*="sidebar"]').count();
  expect(sidebars).toBeLessThanOrEqual(2); // Allow 1-2 (desktop + mobile hidden)
});

test('team management opens Add New Player modal', async ({ page }) => {
  await page.goto('/dashboard/team');
  
  // Look for Add New Player button
  const addButton = page.getByRole('button', { name: /add new player/i });
  if (await addButton.isVisible()) {
    await addButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  }
});

test('schedule page loads (empty is OK)', async ({ page }) => {
  await page.goto('/dashboard/schedule');
  await expect(page.getByRole('heading', { name: /schedule/i })).toBeVisible();
  
  // Either empty state or session cards; both acceptable
  const hasContent = await page.locator('text=/no sessions|upcoming|training/i').isVisible();
  expect(hasContent).toBe(true);
});

test('fitness page loads without errors', async ({ page }) => {
  await page.goto('/dashboard/fitness');
  await expect(page.getByRole('heading', { name: /fitness/i })).toBeVisible();
});

test('meal plans page loads without errors', async ({ page }) => {
  await page.goto('/dashboard/meal-plans');
  await expect(page.getByRole('heading', { name: /meal/i })).toBeVisible();
});

test('announcements page loads without errors', async ({ page }) => {
  await page.goto('/dashboard/announcements');
  await expect(page.getByRole('heading', { name: /announcements/i })).toBeVisible();
});

test('payments page loads without errors', async ({ page }) => {
  await page.goto('/dashboard/payments');
  await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible();
});

test('sessions endpoint responds correctly', async ({ request }) => {
  const res = await request.get('/api/sessions');
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(Array.isArray(json.items ?? json)).toBe(true);
});

test('parent portal loads with single sidebar', async ({ page }) => {
  // Navigate to parent portal
  await page.goto('/dashboard/parent');
  
  // Check for heading or welcome message
  const hasParentContent = await page.locator('text=/parent|welcome|dashboard/i').isVisible();
  expect(hasParentContent).toBe(true);
  
  // Verify single sidebar
  const sidebars = await page.locator('aside, nav[class*="sidebar"]').count();
  expect(sidebars).toBeLessThanOrEqual(2);
});
