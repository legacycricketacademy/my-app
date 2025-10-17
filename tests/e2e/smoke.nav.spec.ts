import { test, expect } from '@playwright/test';
import { loginAs, expectOneSidebar, ADMIN_CREDENTIALS } from '../utils/auth';

// Clear storage state for navigation tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth');
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForURL(/\/dashboard/);
  });

  test('should navigate to all dashboard sections without duplicate sidebars', async ({ page }) => {
    const sections = [
      { name: 'Dashboard', path: '/dashboard', heading: 'Dashboard' },
      { name: 'Team Management', path: '/dashboard/team', heading: 'Team Management' },
      { name: 'Schedule', path: '/dashboard/schedule', heading: 'Schedule' },
      { name: 'Fitness Tracking', path: '/dashboard/fitness', heading: 'Fitness Tracking' },
      { name: 'Meal Plans', path: '/dashboard/meal-plans', heading: 'Meal Plans' },
      { name: 'Announcements', path: '/dashboard/announcements', heading: 'Announcements' },
      { name: 'Payments', path: '/dashboard/payments', heading: 'Payments' },
    ];

    for (const section of sections) {
      // Click the nav link
      await page.click(`a[href="${section.path}"]`);
      
      // Wait for navigation
      await page.waitForURL(section.path);
      
      // Verify page heading is visible
      const heading = page.locator(`h1:has-text("${section.heading}")`).first();
      await expect(heading).toBeVisible({ timeout: 5000 });
      
      // Verify only one sidebar
      await expectOneSidebar(page);
      
      // Small delay for stability
      await page.waitForTimeout(500);
    }
  });

  test('should display correct content on each section', async ({ page }) => {
    // Team Management should have "Add New Player" or similar content
    await page.goto('/dashboard/team');
    await expect(page.locator('h1')).toBeVisible();
    
    // Schedule should have calendar or sessions
    await page.goto('/dashboard/schedule');
    await expect(page.locator('h1:has-text("Schedule")')).toBeVisible();
    
    // Payments should have payment info or empty state
    await page.goto('/dashboard/payments');
    await expect(page.locator('h1:has-text("Payments")')).toBeVisible();
  });
});
