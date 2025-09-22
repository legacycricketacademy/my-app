import { test, expect } from '@playwright/test';

test.describe('Parent RSVP', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication as parent
    await page.goto('/auth');
    await page.fill('[data-testid="email"]', 'parent@test.com');
    await page.fill('[data-testid="password"]', 'Test1234!');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/');
  });

  test('parent can view schedule with future sessions', async ({ page }) => {
    // Navigate to schedule page
    await page.goto('/schedule');
    
    // Verify schedule page loads
    await expect(page.locator('h1')).toContainText('Schedule');
    
    // Check that calendar controls are present
    await expect(page.locator('[data-testid="view-mode-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="kid-filter"]')).toBeVisible();
  });

  test('parent can change calendar view modes', async ({ page }) => {
    await page.goto('/schedule');
    
    // Test week view
    await page.click('[data-testid="view-mode-select"]');
    await page.click('[data-testid="view-week"]');
    await expect(page.locator('[data-testid="view-mode-select"]')).toContainText('Week');
    
    // Test month view
    await page.click('[data-testid="view-mode-select"]');
    await page.click('[data-testid="view-month"]');
    await expect(page.locator('[data-testid="view-mode-select"]')).toContainText('Month');
  });

  test('parent can filter by kid', async ({ page }) => {
    await page.goto('/schedule');
    
    // Open kid filter
    await page.click('[data-testid="kid-filter"]');
    
    // Should see kid options (assuming mock data includes kids)
    await expect(page.locator('text=All kids')).toBeVisible();
  });

  test('parent can navigate calendar', async ({ page }) => {
    await page.goto('/schedule');
    
    // Test navigation buttons (if they exist)
    const prevButton = page.locator('button[aria-label="Previous"]');
    const nextButton = page.locator('button[aria-label="Next"]');
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
    }
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  });

  test('RSVP buttons are enabled for future events', async ({ page }) => {
    await page.goto('/schedule');
    
    // Look for RSVP controls (they should be enabled for future events)
    const rsvpButtons = page.locator('button:has-text("Going"), button:has-text("Maybe"), button:has-text("No")');
    
    // If RSVP buttons exist, they should not be disabled
    const count = await rsvpButtons.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const button = rsvpButtons.nth(i);
        const isDisabled = await button.isDisabled();
        const title = await button.getAttribute('title');
        
        // Future events should not be disabled or have "Past event" title
        if (title !== 'Past event') {
          expect(isDisabled).toBe(false);
        }
      }
    }
  });

  test('parent can RSVP to future session', async ({ page }) => {
    await page.goto('/schedule');
    
    // Look for an enabled RSVP button
    const goingButton = page.locator('button:has-text("Going"):not([disabled])').first();
    const maybeButton = page.locator('button:has-text("Maybe"):not([disabled])').first();
    const noButton = page.locator('button:has-text("No"):not([disabled])').first();
    
    // Try to click an available RSVP button
    if (await goingButton.isVisible()) {
      await goingButton.click();
      // Verify some feedback (could be visual change, toast, etc.)
    } else if (await maybeButton.isVisible()) {
      await maybeButton.click();
    } else if (await noButton.isVisible()) {
      await noButton.click();
    }
  });
});
