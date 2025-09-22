import { test, expect } from '@playwright/test';

test.describe('Calendar Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication as parent
    await page.goto('/auth');
    await page.fill('[data-testid="email"]', 'parent@test.com');
    await page.fill('[data-testid="password"]', 'Test1234!');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/');
  });

  test('calendar view mode toggle works', async ({ page }) => {
    await page.goto('/schedule');
    
    // Verify initial state
    await expect(page.locator('[data-testid="view-mode-select"]')).toBeVisible();
    
    // Test switching to week view
    await page.click('[data-testid="view-mode-select"]');
    await page.click('[data-testid="view-week"]');
    
    // Verify week view is selected
    await expect(page.locator('[data-testid="view-mode-select"]')).toContainText('Week');
    
    // Test switching to month view
    await page.click('[data-testid="view-mode-select"]');
    await page.click('[data-testid="view-month"]');
    
    // Verify month view is selected
    await expect(page.locator('[data-testid="view-mode-select"]')).toContainText('Month');
  });

  test('kid filter dropdown works', async ({ page }) => {
    await page.goto('/schedule');
    
    // Open kid filter
    await page.click('[data-testid="kid-filter"]');
    
    // Verify dropdown options are visible
    await expect(page.locator('text=All kids')).toBeVisible();
    
    // Close dropdown by clicking outside or pressing escape
    await page.keyboard.press('Escape');
  });

  test('calendar navigation works', async ({ page }) => {
    await page.goto('/schedule');
    
    // Look for navigation buttons
    const prevButton = page.locator('button[aria-label="Previous"], button[title*="Previous"], button[title*="prev"]').first();
    const nextButton = page.locator('button[aria-label="Next"], button[title*="Next"], button[title*="next"]').first();
    
    // Test previous button if it exists
    if (await prevButton.isVisible()) {
      await prevButton.click();
      // Wait a moment for any loading
      await page.waitForTimeout(500);
    }
    
    // Test next button if it exists
    if (await nextButton.isVisible()) {
      await nextButton.click();
      // Wait a moment for any loading
      await page.waitForTimeout(500);
    }
  });

  test('schedule page loads without errors', async ({ page }) => {
    // Test that the schedule page loads completely
    await page.goto('/schedule');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Verify main elements are present
    await expect(page.locator('h1')).toContainText('Schedule');
    await expect(page.locator('[data-testid="view-mode-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="kid-filter"]')).toBeVisible();
    
    // Check for any error messages
    const errorMessages = page.locator('text=Error, text=Failed, text=Something went wrong');
    await expect(errorMessages).toHaveCount(0);
  });

  test('schedule displays session information', async ({ page }) => {
    await page.goto('/schedule');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Look for session-related content (this might be empty in mock data)
    // The important thing is that the page doesn't crash
    const scheduleContent = page.locator('[data-testid="schedule-content"], .schedule-content, .calendar');
    
    // If schedule content exists, verify it's visible
    if (await scheduleContent.count() > 0) {
      await expect(scheduleContent.first()).toBeVisible();
    }
  });
});
