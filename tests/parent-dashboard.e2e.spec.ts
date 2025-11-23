import { test, expect } from '@playwright/test';

test.describe.skip('Parent Dashboard E2E (requires parent user)', () => {
  test('kids list loads for logged-in parent', async ({ page }) => {
    // Navigate to parent kids list
    await page.goto('/parent/kids');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we were redirected (not a parent user)
    const currentUrl = page.url();
    if (!currentUrl.includes('/parent/kids')) {
      test.skip();
      return;
    }
    
    // Assert: The kids list heading is visible with parent-friendly text
    const heading = page.getByTestId('heading-kids-list');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('My Children');
    
    // Assert: Check if we have kids or improved empty state
    const kidCards = page.getByTestId('kid-card');
    const kidCount = await kidCards.count();
    
    if (kidCount > 0) {
      // At least one kid card is visible
      await expect(kidCards.first()).toBeVisible();
    } else {
      // Improved empty state should be visible
      const noKidsHeading = page.getByTestId('no-kids-heading');
      await expect(noKidsHeading).toBeVisible();
      await expect(noKidsHeading).toHaveText('Welcome to Legacy Cricket!');
      
      // Verify friendly message is shown
      await expect(page.locator('text=/evaluation session|coaches will add/i')).toBeVisible();
    }
  });

  test('kid dashboard opens from kids list', async ({ page }) => {
    // Start from parent landing page
    await page.goto('/parent/kids');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we were redirected (not a parent user)
    const currentUrl = page.url();
    if (!currentUrl.includes('/parent/kids')) {
      test.skip();
      return;
    }
    
    // Check if there are any kids
    const kidCards = page.getByTestId('kid-card');
    const kidCount = await kidCards.count();
    
    if (kidCount > 0) {
      // Click the "View Dashboard" button on the first kid card
      const firstKidCard = kidCards.first();
      const viewDashboardButton = firstKidCard.getByTestId('btn-view-dashboard');
      await viewDashboardButton.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Assert: The kid dashboard heading (kid name) is visible
      const kidName = page.getByTestId('kid-name');
      await expect(kidName).toBeVisible();
      
      // Assert: The upcoming sessions section exists
      const upcomingSessionsHeading = page.getByText('Upcoming Sessions');
      await expect(upcomingSessionsHeading).toBeVisible();
      
      // Check for either sessions or empty state (don't assume sessions exist)
      const sessionRows = page.getByTestId('session-row');
      const noSessionsMessage = page.getByTestId('no-sessions');
      
      const hasSessionRows = await sessionRows.count() > 0;
      const hasNoSessionsMessage = await noSessionsMessage.isVisible().catch(() => false);
      
      // Either sessions exist or the "no sessions" message is shown
      expect(hasSessionRows || hasNoSessionsMessage).toBe(true);
    } else {
      // Skip test if no kids exist
      test.skip();
    }
  });
});

// Smoke test that doesn't require parent role
test.describe('Parent Dashboard - API Routes', () => {
  test('parent API routes are registered', async ({ request }) => {
    // Test that the routes exist (will return 401 or 403 without proper auth)
    const kidsResponse = await request.get('http://127.0.0.1:3000/api/parent/kids');
    expect([401, 403]).toContain(kidsResponse.status());
    
    const dashboardResponse = await request.get('http://127.0.0.1:3000/api/parent/kids/1/dashboard');
    expect([401, 403, 404]).toContain(dashboardResponse.status());
  });
});
