import { test, expect } from '@playwright/test';
import { loginAs, ADMIN_CREDENTIALS } from '../utils/auth';

// Clear storage state and login fresh
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Date Picker Apply/Cancel Buttons', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to dashboard and open modal
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click "Schedule New Session" button
    const scheduleButton = page.locator('button:has-text("Schedule New Session"), button:has-text("Schedule New")').first();
    await scheduleButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  });

  test('should show Apply and Cancel buttons in date picker', async ({ page }) => {
    // Click Start Date & Time field
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    
    // Wait for popover to open
    await page.waitForTimeout(500);
    
    // Verify Apply button exists
    const applyButton = page.locator('button:has-text("Apply")').first();
    await expect(applyButton).toBeVisible({ timeout: 5000 });
    
    // Verify Cancel button exists
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await expect(cancelButton).toBeVisible();
    
    // Verify Clear button exists
    const clearButton = page.locator('button:has-text("Clear")').first();
    await expect(clearButton).toBeVisible();
  });

  test('should have functional time selection controls', async ({ page }) => {
    // Click Start Date & Time field
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    
    // Wait for popover
    await page.waitForTimeout(500);
    
    // Verify time selection controls are present
    const hourSelect = page.getByTestId('start-time-hours');
    await expect(hourSelect).toBeVisible();
    
    const minuteSelect = page.getByTestId('start-time-minutes');
    await expect(minuteSelect).toBeVisible();
    
    // Verify calendar is present
    const calendar = page.locator('.rdp'); // react-day-picker class
    await expect(calendar).toBeVisible();
  });

  test('should close popover when clicking Apply', async ({ page }) => {
    // Click Start Date & Time field
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    
    // Wait for popover
    await page.waitForTimeout(500);
    
    // Verify popover is open
    const applyButton = page.locator('button:has-text("Apply")').first();
    await expect(applyButton).toBeVisible();
    
    // Click Apply button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const applyBtn = buttons.find(btn => btn.textContent?.includes('Apply'));
      if (applyBtn) applyBtn.click();
    });
    
    // Wait for popover to close
    await page.waitForTimeout(500);
    
    // Verify popover closed (Apply button no longer visible)
    await expect(applyButton).not.toBeVisible();
  });

  test('should close popover when clicking Cancel', async ({ page }) => {
    // Click Start Date & Time field
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    
    // Wait for popover
    await page.waitForTimeout(500);
    
    // Verify popover is open
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await expect(cancelButton).toBeVisible();
    
    // Click Cancel button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(btn => btn.textContent?.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    
    // Wait for popover to close
    await page.waitForTimeout(500);
    
    // Verify popover closed (Cancel button no longer visible)
    await expect(cancelButton).not.toBeVisible();
  });

  test('should close popover when clicking Clear', async ({ page }) => {
    // Click Start Date & Time field
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    
    // Wait for popover
    await page.waitForTimeout(500);
    
    // Verify popover is open and Clear button is visible
    const clearButton = page.locator('button:has-text("Clear")').first();
    await expect(clearButton).toBeVisible();
    
    // Click Clear button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clearBtn = buttons.find(btn => btn.textContent?.includes('Clear'));
      if (clearBtn) clearBtn.click();
    });
    
    // Wait for popover to close
    await page.waitForTimeout(500);
    
    // Verify popover closed (Clear button no longer visible)
    await expect(clearButton).not.toBeVisible();
    
    // Verify the button is still present and clickable
    await expect(startTimeButton).toBeVisible();
  });

  test('should keep field usable when date and time are selected and Apply is clicked', async ({ page }) => {
    // Click Start Date & Time field
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    
    // Open the picker
    await startTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select a date (click day 17 if available, otherwise first day)
    const day17 = page.locator('button[name="day"]').filter({ hasText: '17' });
    const dayExists = await day17.count() > 0;
    if (dayExists) {
      await day17.first().click();
    } else {
      await page.locator('button[name="day"]').first().click();
    }
    await page.waitForTimeout(300);
    
    // Select time using the test IDs
    await page.getByTestId('start-time-hours').selectOption('14');
    await page.getByTestId('start-time-minutes').selectOption('30');
    await page.waitForTimeout(300);
    
    // Click Apply
    const applyButton = page.locator('button:has-text("Apply")').first();
    await applyButton.click();
    
    // Wait for popover to close
    await page.waitForTimeout(500);
    
    // Assert: popover is closed (Apply button no longer visible)
    await expect(applyButton).not.toBeVisible();
    
    // Assert: the button is still visible and usable after Apply
    await expect(startTimeButton).toBeVisible();
    
    // Optional: make sure we can reopen the picker
    await startTimeButton.click();
    await page.waitForTimeout(500);
    const selectDateLabel = page.locator('text=Select Date').first();
    await expect(selectDateLabel).toBeVisible();
  });
});
