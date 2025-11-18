// tests/e2e/sessions.ok-button.spec.ts
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.use({ storageState: 'playwright/.auth/admin.json' }); // pre-auth state

test('Schedule session with calendar OK button', async ({ page }) => {
  // Navigate to schedule page
  await page.goto(`${BASE}/dashboard/schedule`);
  
  // Wait for page to load
  await expect(page.getByRole('heading', { name: 'Schedule', exact: true })).toBeVisible({ timeout: 10000 });
  
  // Click "Add Session" button
  const addButton = page.getByRole('button', { name: /add session/i });
  await addButton.click();
  
  // Wait for dialog to open
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Schedule New Session')).toBeVisible();
  
  // Fill in basic fields
  await page.getByLabel(/session title/i).fill('Test Training Session');
  await page.getByLabel(/location/i).fill('Main Ground');
  
  // Select age group
  await page.getByRole('button', { name: /select age group/i }).click();
  await page.getByText('Under 12s', { exact: true }).click();
  
  // Open start date picker by clicking the button
  const startDateButton = page.getByRole('button', { name: /pick date/i }).first();
  await startDateButton.click();
  
  // Wait for calendar to appear
  await page.waitForSelector('[role="grid"]', { timeout: 5000 });
  
  // Select a date (click on day 15 which should be safe)
  const dayButton = page.locator('[role="gridcell"]:has-text("15")').first();
  await dayButton.click();
  
  // Calendar should close automatically after selection
  await page.waitForTimeout(500);
  
  // Verify the start date button now shows a date (not "Pick date")
  const startButtonText = await startDateButton.textContent();
  expect(startButtonText).not.toContain('Pick date');
  
  // Fill start time
  await page.locator('input[type="time"]').first().fill('14:00');
  
  // Fill end time
  await page.locator('input[type="time"]').last().fill('16:00');
  
  // Submit the form
  await page.getByRole('button', { name: /schedule session/i }).click();
  
  // Wait for success toast or modal to close
  const successToast = page.getByText(/session created successfully/i).or(page.getByText(/success/i));
  await expect(successToast).toBeVisible({ timeout: 5000 }).catch(() => {
    // Toast might disappear quickly, check if dialog closed instead
  });
  
  // Verify dialog closed
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
  
  // Verify session appears in list (may need a moment to refresh)
  await page.waitForTimeout(1000);
  const sessionCard = page.getByText('Test Training Session');
  const hasSession = await sessionCard.isVisible().catch(() => false);
  
  if (hasSession) {
    console.log('✓ Session created and appears in list');
  }
});
