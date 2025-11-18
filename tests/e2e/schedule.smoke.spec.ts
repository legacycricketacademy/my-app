// tests/e2e/schedule.smoke.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, ADMIN_CREDENTIALS } from '../utils/auth';

// Clear storage state and login fresh for each test
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Schedule Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForURL(/\/dashboard/);
    
    // Wait for session to be fully established
    await page.waitForTimeout(1000);
  });

  test('dashboard loads with schedule section visible', async ({ page }) => {
    // Navigate to main dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify Today's Schedule card is present
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible({ timeout: 10000 });
    
    // Verify Schedule New Session button is present
    await expect(page.locator('button:has-text("Schedule New Session"), button:has-text("Schedule New")').first()).toBeVisible();
  });

  test('schedule new session modal opens successfully', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click "Schedule New Session" button
    const scheduleButton = page.locator('button:has-text("Schedule New Session"), button:has-text("Schedule New")').first();
    await scheduleButton.click();
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Check that modal has the expected title
    await expect(page.getByText('Schedule New Training Session')).toBeVisible();
    
    // Check that form is present (at least one input)
    await expect(page.locator('input').first()).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Verify modal closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test.skip('can create a new session with correct time and verify it displays', async ({ page }) => {
    // Ensure we're authenticated
    await page.waitForTimeout(1000);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click "Schedule New Session" button
    const scheduleButton = page.locator('button:has-text("Schedule New Session"), button:has-text("Schedule New")').first();
    await scheduleButton.click();
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill in the form
    await page.fill('input[name="title"]', 'E2E Test Session');
    
    // Select start date & time
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select a date (first available day)
    await page.locator('button[name="day"]').first().click();
    
    // Set start time to 10:00
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const hourSelect = selects.find(s => s.getAttribute('data-testid') === 'start-time-hours');
      const minuteSelect = selects.find(s => s.getAttribute('data-testid') === 'start-time-minutes');
      if (hourSelect) {
        (hourSelect as HTMLSelectElement).value = '10';
        hourSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (minuteSelect) {
        (minuteSelect as HTMLSelectElement).value = '0';
        minuteSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    // Click Apply
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const applyBtn = buttons.find(btn => btn.textContent?.includes('Apply'));
      if (applyBtn) applyBtn.click();
    });
    await page.waitForTimeout(500);
    
    // Select end date & time
    const endTimeButton = page.locator('button:has-text("Select date & time")').last();
    await endTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select the same date
    await page.locator('button[name="day"]').first().click();
    
    // Set end time to 11:30
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const hourSelect = selects.find(s => s.getAttribute('data-testid') === 'end-time-hours');
      const minuteSelect = selects.find(s => s.getAttribute('data-testid') === 'end-time-minutes');
      if (hourSelect) {
        (hourSelect as HTMLSelectElement).value = '11';
        hourSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (minuteSelect) {
        (minuteSelect as HTMLSelectElement).value = '30';
        minuteSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    // Click Apply
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const applyBtns = buttons.filter(btn => btn.textContent?.includes('Apply'));
      // Get the last Apply button (for end time)
      if (applyBtns.length > 0) applyBtns[applyBtns.length - 1].click();
    });
    await page.waitForTimeout(500);
    
    // Select location
    await page.click('button:has-text("Select location")');
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
    
    // Fill max attendees
    await page.fill('input[name="maxAttendees"]', '20');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Schedule Session")');
    
    // Wait for modal to close (indicates success or error)
    await page.waitForTimeout(2000);
    
    // Check if modal closed (success) or if there's an error message
    const modalVisible = await page.getByRole('dialog').isVisible();
    
    if (modalVisible) {
      // Modal still open, might be an error - log it
      const errorText = await page.locator('text=/failed|error/i').first().textContent().catch(() => 'No error text found');
      console.log('Modal still open, possible error:', errorText);
    }
    
    // Navigate to the schedule page to verify the session was created with correct time
    await page.goto('/coach/schedule');
    await page.waitForLoadState('networkidle');
    
    // Wait for sessions to load
    await page.waitForTimeout(2000);
    
    // Look for the session we just created
    const sessionCard = page.locator('text=E2E Test Session').first();
    await expect(sessionCard).toBeVisible({ timeout: 10000 });
    
    // Verify the time is displayed correctly (10:00 AM - 11:30 AM)
    // The format should be "h:mm a" or "h:mma" based on CoachSchedule.tsx
    // Look for the parent container that has both the title and time
    const sessionContainer = page.locator('div').filter({ hasText: 'E2E Test Session' }).first();
    
    // Check if the time range is visible within that container
    await expect(sessionContainer.locator('text=/10:00.*11:30/i')).toBeVisible({ timeout: 5000 });
  });
});
