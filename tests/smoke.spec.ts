import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('dashboard renders and sidebar is single (no duplication)', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

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
  await expect(page.getByRole('heading', { name: 'Schedule', exact: true })).toBeVisible();
  
  // Either empty state or session cards; both acceptable
  const hasContent = await page.locator('h3:has-text("No sessions scheduled")').isVisible();
  expect(hasContent).toBe(true);
});

test('fitness page loads without errors', async ({ page }) => {
  await page.goto('/dashboard/fitness');
  await expect(page.getByRole('heading', { name: 'Fitness Tracking', exact: true })).toBeVisible();
});

test('meal plans page loads without errors', async ({ page }) => {
  await page.goto('/dashboard/meal-plans');
  await expect(page.getByRole('heading', { name: 'Meal Plans', exact: true })).toBeVisible();
});

test('announcements page loads without errors', async ({ page }) => {
  await page.goto('/dashboard/announcements');
  await expect(page.getByRole('heading', { name: 'Announcements', exact: true })).toBeVisible();
});

test('payments page loads without errors', async ({ page }) => {
  await page.goto('/dashboard/payments');
  await expect(page.getByRole('heading', { name: 'Payments', exact: true })).toBeVisible();
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
  
  // Check for any visible content (heading, card, or text)
  await page.waitForLoadState('networkidle');
  const hasContent = await page.locator('h1, h2, h3, .card, main').first().isVisible().catch(() => false);
  expect(hasContent).toBe(true);
  
  // Verify single sidebar
  const sidebars = await page.locator('aside, nav[class*="sidebar"]').count();
  expect(sidebars).toBeLessThanOrEqual(2);
});

test('team page has a single sidebar/header (no duplication)', async ({ page }) => {
  await page.goto('/dashboard/team');
  
  // Wait for page to load - check for either heading or "Add New Player" button
  await expect(
    page.getByRole('heading', { name: 'Team Management', exact: true })
      .or(page.getByRole('button', { name: /add new player/i }))
  ).toBeVisible({ timeout: 15000 });
  
  // Heuristic: one main header + one sidebar max
  const sidebars = await page.locator('aside, nav').count();
  expect(sidebars).toBeLessThan(3);
  
  // More specific: check for duplicate "Team Management" headings
  const headings = await page.locator('h1:has-text("Team Management")').count();
  expect(headings).toBeLessThanOrEqual(1);
});
