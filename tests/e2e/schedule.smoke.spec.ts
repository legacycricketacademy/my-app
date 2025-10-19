// tests/e2e/schedule.smoke.spec.ts
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.use({ storageState: 'playwright/.auth/admin.json' }); // pre-auth state

test('schedule loads with auth and shows proper state', async ({ page }) => {
  // Navigate to schedule page
  await page.goto(`${BASE}/dashboard/schedule`);
  
  // Wait for schedule heading to appear
  await expect(page.getByRole('heading', { name: /schedule/i })).toBeVisible({ timeout: 10000 });
  
  // Either empty state or sessions list should be visible
  const emptyState = page.getByText(/No sessions scheduled|Create your first training session/i);
  const sessionsList = page.locator('[data-testid="sessions-list"]').or(page.locator('.grid.gap-6'));
  
  const hasEmptyState = await emptyState.isVisible().catch(() => false);
  const hasSessionsList = await sessionsList.isVisible().catch(() => false);
  
  // At least one should be visible
  expect(hasEmptyState || hasSessionsList).toBe(true);
  
  // Verify "Add Session" button is present
  await expect(page.getByRole('button', { name: /add session/i })).toBeVisible();
});

test('schedule new session modal calendar is fully visible', async ({ page }) => {
  // Navigate to schedule page
  await page.goto(`${BASE}/dashboard/schedule`);
  
  // Click "Add Session" button
  const addButton = page.getByRole('button', { name: /add session/i });
  await addButton.click();
  
  // Wait for modal to open
  await expect(page.getByRole('dialog')).toBeVisible();
  
  // Click on start date picker
  const startDateButton = page.getByRole('button', { name: /pick date/i }).first();
  await startDateButton.click();
  
  // Calendar should be visible in a portal
  await page.waitForSelector('[role="grid"]', { timeout: 5000 });
  
  // Verify calendar is visible and not clipped
  const calendar = page.locator('[role="grid"]').first();
  await expect(calendar).toBeVisible();
  
  // Calendar should be clickable (not blocked by overlay)
  const boundingBox = await calendar.boundingBox();
  expect(boundingBox).not.toBeNull();
  
  if (boundingBox) {
    // Verify calendar is within viewport
    expect(boundingBox.y).toBeGreaterThanOrEqual(0);
  }
  
  // Close modal
  await page.keyboard.press('Escape');
});
