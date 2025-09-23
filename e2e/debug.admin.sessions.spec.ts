import { test, expect } from '@playwright/test';

test.describe('Debug Admin Sessions', () => {
  test('debug admin sessions access', async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'debug' || msg.type() === 'warn' || msg.type() === 'error') {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
      }
    });

    // Go to auth page first
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Login as admin
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('After login, URL is:', page.url());
    
    // Navigate to admin sessions
    await page.goto('http://localhost:3000/admin/sessions');
    await page.waitForLoadState('networkidle');
    
    console.log('After navigating to /admin/sessions, URL is:', page.url());
    
    // Check if admin sessions page is visible
    const isAdminSessionsPageVisible = await page.locator('[data-testid="admin-sessions-page"]').isVisible();
    console.log('Admin sessions page visible:', isAdminSessionsPageVisible);
    
    // Check if admin dashboard is visible (if redirected)
    const isAdminDashboardVisible = await page.locator('[data-testid="dashboard-title"]').isVisible();
    console.log('Admin dashboard visible:', isAdminDashboardVisible);
    
    // Check page title
    const pageTitle = await page.locator('h1').first().textContent();
    console.log('Page title:', pageTitle);
  });
});
