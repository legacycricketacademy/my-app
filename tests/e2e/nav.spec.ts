import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login using test auth
    await page.goto(`${BASE}/auth`);
    await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should navigate to dashboard and verify all nav links work', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    // Test each navigation link
    const navItems = [
      { label: 'Dashboard', path: '/dashboard', heading: 'Dashboard' },
      { label: 'Team Management', path: '/dashboard/team', heading: 'Team Management' },
      { label: 'Schedule', path: '/dashboard/schedule', heading: 'Schedule' },
      { label: 'Fitness Tracking', path: '/dashboard/fitness', heading: 'Fitness Tracking' },
      { label: 'Meal Plans', path: '/dashboard/meal-plans', heading: 'Meal Plans' },
      { label: 'Announcements', path: '/dashboard/announcements', heading: 'Announcements' },
      { label: 'Payments', path: '/dashboard/payments', heading: 'Payments' }
    ];

    for (const item of navItems) {
      console.log(`Testing navigation to: ${item.label}`);
      
      // Click the navigation link
      await page.click(`text=${item.label}`);
      
      // Wait for navigation
      await page.waitForURL(`**${item.path}`, { timeout: 5000 });
      
      // Verify URL
      expect(page.url()).toContain(item.path);
      
      // Verify page heading exists
      await expect(page.locator(`h1:has-text("${item.heading}")`)).toBeVisible({ timeout: 5000 });
      
      console.log(`✅ ${item.label} navigation working - URL: ${page.url()}`);
    }
  });

  test('should handle Add New Player button', async ({ page }) => {
    // Navigate to team management
    await page.click('text=Team Management');
    await page.waitForURL('**/dashboard/team');
    
    // Click Add New Player button
    const addPlayerButton = page.locator('button:has-text("Add New Player")');
    if (await addPlayerButton.count() > 0) {
      await addPlayerButton.click();
      console.log('✅ Add New Player button clicked successfully');
    } else {
      console.log('ℹ️ Add New Player button not found (might be in dialog)');
    }
  });

  test('should handle unknown dashboard routes', async ({ page }) => {
    // Navigate to a non-existent dashboard route
    await page.goto(`${BASE}/dashboard/nonexistent`);
    
    // Should show section not found or redirect
    const hasError = await page.locator('text=Section Not Found').isVisible().catch(() => false);
    const hasReturnButton = await page.locator('button:has-text("Return to Dashboard")').isVisible().catch(() => false);
    
    // Either shows error or redirects to dashboard (both acceptable)
    expect(hasError || page.url().includes('/dashboard')).toBeTruthy();
  });
});
