import { test, expect } from '@playwright/test';
import { loginAs, ADMIN_CREDENTIALS } from '../utils/auth';

// Mobile-specific test
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Mobile Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForURL(/\/dashboard/);
    await page.waitForTimeout(1000);
  });

  test('Schedule page is mobile-responsive and session creation works', async ({ page }) => {
    // Navigate to Schedule page
    await page.goto('/coach/schedule');
    await page.waitForLoadState('networkidle');
    
    // Verify page loads without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
    
    // Verify "Schedule New Session" button is visible and reachable
    const scheduleButton = page.locator('button:has-text("Schedule New Session")').first();
    await expect(scheduleButton).toBeVisible();
    
    // Click the button
    await scheduleButton.click();
    
    // On mobile, should open as a Sheet (full-screen dialog)
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
    
    // Verify the sheet title is visible
    await expect(page.getByText('Schedule New Training Session')).toBeVisible();
    
    // Fill in the form
    const timestamp = Date.now();
    const sessionTitle = `Mobile Test ${timestamp}`;
    
    // Title field should be visible and fillable
    const titleInput = page.locator('input[placeholder*="Batting Practice"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(sessionTitle);
    
    // Open Start Date & Time picker
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await expect(startTimeButton).toBeVisible();
    await startTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select a date
    const dayButton = page.locator('button[name="day"]').first();
    await expect(dayButton).toBeVisible();
    await dayButton.click();
    await page.waitForTimeout(300);
    
    // Set start time
    await page.getByTestId('start-time-hours').selectOption('14');
    await page.getByTestId('start-time-minutes').selectOption('0');
    await page.waitForTimeout(300);
    
    // Click Apply (DOM-based click to avoid WebKit viewport issues)
    const applyButtonStart = page.locator('button:has-text("Apply")').first();
    await applyButtonStart.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await applyButtonStart.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(500);
    
    // Open End Date & Time picker
    const endTimeButton = page.locator('button:has-text("Select date & time")').last();
    await expect(endTimeButton).toBeVisible();
    await endTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select same date
    const dayButtonEnd = page.locator('button[name="day"]').first();
    await dayButtonEnd.click();
    await page.waitForTimeout(300);
    
    // Set end time
    await page.getByTestId('end-time-hours').selectOption('16');
    await page.getByTestId('end-time-minutes').selectOption('0');
    await page.waitForTimeout(300);
    
    // Click Apply (DOM-based click to avoid WebKit viewport issues)
    const applyButtonEnd = page.locator('button:has-text("Apply")').last();
    await applyButtonEnd.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await applyButtonEnd.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(500);
    
    // Select location - verify dropdown is reachable
    const locationButton = page.locator('button:has-text("Select location")');
    await expect(locationButton).toBeVisible();
    await locationButton.click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Strongsville")').click();
    
    // Select age group
    await page.click('button:has-text("Select age group")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("5-8 years")').click();
    
    // Select session type
    await page.click('button:has-text("Select type")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Training")').click();
    
    // Fill max players
    const maxPlayersInput = page.locator('input[type="number"]');
    await expect(maxPlayersInput).toBeVisible();
    await maxPlayersInput.fill('20');
    
    // Verify submit button is visible and reachable (even with keyboard)
    const submitButton = page.locator('button[type="submit"]:has-text("Schedule Session")');
    await expect(submitButton).toBeVisible();
    
    // Listen for POST request
    const postPromise = page.waitForResponse(
      response => response.url().includes('/api/coach/sessions') && response.request().method() === 'POST'
    );
    
    // Submit the form
    await submitButton.click();
    
    // Wait for and validate POST response
    const postResponse = await postPromise;
    expect(postResponse.status()).toBe(201);
    
    // Wait for success toast
    await expect(page.getByText('Session created successfully').first()).toBeVisible({ timeout: 10000 });
    
    // Verify sheet closes
    await expect(sheet).not.toBeVisible({ timeout: 5000 });
    
    // Verify no content is clipped or off-screen
    const isOverflowing = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);
    
    // Verify no error banners
    await expect(page.getByText('Failed to load schedule')).not.toBeVisible();
  });
});
