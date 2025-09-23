import { test, expect } from '@playwright/test';

test.describe('Debug Route Matching', () => {
  test('debug route matching for admin sessions', async ({ page }) => {
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
    
    // Try to go to admin sessions directly
    console.log('Navigating to /admin/sessions...');
    await page.goto('http://localhost:3000/admin/sessions');
    await page.waitForTimeout(3000); // Wait 3 seconds to see what happens
    
    console.log('After navigating to /admin/sessions, URL is:', page.url());
    
    // Check if we can see any content
    const bodyText = await page.textContent('body');
    console.log('Page body contains:', bodyText?.substring(0, 300));
    
    // Check if we can see the admin sessions page content
    const adminSessionsPage = await page.locator('[data-testid="admin-sessions-page"]').isVisible();
    console.log('Admin sessions page visible:', adminSessionsPage);
    
    // Check if we can see the admin dashboard content
    const adminDashboard = await page.locator('text=Admin Dashboard').isVisible();
    console.log('Admin dashboard visible:', adminDashboard);
  });
});
