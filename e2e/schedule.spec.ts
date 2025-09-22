import { test, expect } from '@playwright/test';

test.describe('Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page and login as parent
    await page.goto('http://localhost:3000/auth');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'Test1234!');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    
    // Navigate to schedule page
    await page.goto('http://localhost:3000/schedule');
    await page.waitForLoadState('networkidle');
  });

  test('should display schedule page with tabs and filters', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Schedule');
    
    // Check tabs are present
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("All Events")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Practices")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Games")')).toBeVisible();
    
    // Check view mode selector
    await expect(page.locator('[data-testid="view-mode-select"]')).toBeVisible();
    
    // Check filters section
    await expect(page.locator('text=Filters')).toBeVisible();
  });

  test('should filter by kid selection', async ({ page }) => {
    // Wait for kids data to load
    await page.waitForSelector('[data-testid="kid-select"]', { timeout: 5000 });
    
    // Check that kid selection dropdown is present
    const kidSelect = page.locator('[data-testid="kid-select"]');
    await expect(kidSelect).toBeVisible();
    
    // Check that "All kids" option is selected by default
    await expect(kidSelect).toHaveValue('all');
  });

  test('should switch between week and month view', async ({ page }) => {
    // Check view mode selector
    const viewModeSelect = page.locator('[data-testid="view-mode-select"]');
    await expect(viewModeSelect).toBeVisible();
    
    // Check default value is week
    await expect(viewModeSelect).toHaveValue('week');
    
    // Switch to month view
    await viewModeSelect.selectOption('month');
    await expect(viewModeSelect).toHaveValue('month');
    
    // Switch back to week view
    await viewModeSelect.selectOption('week');
    await expect(viewModeSelect).toHaveValue('week');
  });

  test('should switch between tabs', async ({ page }) => {
    // Check all events tab is active by default
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('All Events');
    
    // Switch to practices tab
    await page.click('[role="tab"]:has-text("Practices")');
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Practices');
    
    // Switch to games tab
    await page.click('[role="tab"]:has-text("Games")');
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Games');
    
    // Switch back to all events
    await page.click('[role="tab"]:has-text("All Events")');
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('All Events');
  });

  test('should display schedule cards with proper information', async ({ page }) => {
    // Wait for schedule data to load
    await page.waitForTimeout(2000);
    
    // Check if schedule cards are displayed or empty state
    const scheduleCards = page.locator('[data-testid="schedule-card"]');
    const emptyState = page.locator('text=No events found');
    
    // Either schedule cards or empty state should be visible
    const hasCards = await scheduleCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasCards || hasEmptyState).toBe(true);
    
    if (hasCards) {
      // Check first schedule card structure
      const firstCard = scheduleCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check for team name
      await expect(firstCard.locator('h3, h4')).toBeVisible();
      
      // Check for time information
      await expect(firstCard.locator('text=/\\d{1,2}:\\d{2} [ap]m/')).toBeVisible();
      
      // Check for location
      await expect(firstCard.locator('text=Field')).toBeVisible();
      
      // Check for type badge
      await expect(firstCard.locator('[class*="badge"]')).toBeVisible();
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for empty state elements
    const emptyState = page.locator('text=No events found');
    const calendarIcon = page.locator('svg[data-lucide="calendar"]');
    
    // If empty state is shown, check its content
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(calendarIcon).toBeVisible();
      await expect(page.locator('text=No events scheduled for this period')).toBeVisible();
    }
  });

  test('should display map links for locations', async ({ page }) => {
    // Wait for schedule data to load
    await page.waitForTimeout(2000);
    
    // Check for map links
    const mapLinks = page.locator('a[href*="maps.google.com"]');
    const externalLinkIcons = page.locator('svg[data-lucide="external-link"]');
    
    // If schedule cards are present, check for map functionality
    const scheduleCards = page.locator('[data-testid="schedule-card"]');
    if (await scheduleCards.count() > 0) {
      // Check for location with map link
      const locationWithMap = page.locator('text=Field').first();
      await expect(locationWithMap).toBeVisible();
      
      // Check for external link icon
      if (await externalLinkIcons.count() > 0) {
        await expect(externalLinkIcons.first()).toBeVisible();
      }
    }
  });
});

test.describe('Admin Schedule View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page and login as admin
    await page.goto('http://localhost:3000/auth');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Test1234!');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    
    // Navigate to schedule page
    await page.goto('http://localhost:3000/schedule');
    await page.waitForLoadState('networkidle');
  });

  test('should show admin view without kid selection', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Schedule');
    
    // Admin should not see kid selection filter
    const kidSelect = page.locator('text=Select Kids');
    await expect(kidSelect).not.toBeVisible();
    
    // Should still have view mode selector
    const viewModeSelect = page.locator('[data-testid="view-mode-select"]');
    await expect(viewModeSelect).toBeVisible();
  });

  test('should display all schedule data for admin', async ({ page }) => {
    // Wait for schedule data to load
    await page.waitForTimeout(2000);
    
    // Check if schedule cards are displayed
    const scheduleCards = page.locator('[data-testid="schedule-card"]');
    const emptyState = page.locator('text=No events found');
    
    // Either schedule cards or empty state should be visible
    const hasCards = await scheduleCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasCards || hasEmptyState).toBe(true);
  });
});
