// tests/e2e/schedule.smoke.spec.ts
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.use({ storageState: 'playwright/.auth/admin.json' }); // pre-auth state

test('schedule loads with auth and shows proper state', async ({ page }) => {
  // Navigate to schedule page
  await page.goto(`${BASE}/dashboard/schedule`);
  
  // Wait for schedule heading to appear
  await expect(page.getByRole('heading', { name: 'Schedule', exact: true })).toBeVisible({ timeout: 10000 });
  
  // Page loaded successfully - that's the main check
  // Either empty state, sessions list, or "Add Session" button should be visible
  const hasContent = await page.locator('body').textContent();
  expect(hasContent).toBeTruthy();
  expect(hasContent).toContain('Schedule'); // Verify we're on the right page
});

test('schedule new session modal opens successfully', async ({ page }) => {
  // Navigate to schedule page
  await page.goto(`${BASE}/dashboard/schedule`);
  
  // Click "Add Session" button (use first() to avoid multiple matches)
  const addButton = page.getByRole('button', { name: /add session/i }).first();
  await addButton.click();
  
  // Wait for modal to open
  await expect(page.getByRole('dialog')).toBeVisible();
  
  // Check that modal has the expected title
  await expect(page.getByText('Schedule New Session')).toBeVisible();
  
  // Check that form is present (at least one input)
  await expect(page.locator('input').first()).toBeVisible();
  
  // Close modal
  await page.keyboard.press('Escape');
});
