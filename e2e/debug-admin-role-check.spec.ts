import { test, expect } from '@playwright/test';

test.describe('Debug Admin Role Check', () => {
  test('debug admin role and auth state', async ({ page }) => {
    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.clear());
    
    // Login as admin
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Check what happens when we navigate to admin sessions
    console.log('=== Navigating to /admin/sessions ===');
    await page.goto('http://localhost:3000/admin/sessions');
    await page.waitForLoadState('networkidle');
    
    // Log the current URL
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);
    
    // Log captured console logs
    console.log('Console logs:', logs);
    
    // Check localStorage
    const authUser = await page.evaluate(() => localStorage.getItem('auth:user'));
    console.log('Auth user in localStorage:', authUser);
    
    // Check if the page has any error messages
    const errorMessages = await page.locator('[data-testid="error"], .error, [role="alert"]').allTextContents();
    console.log('Error messages on page:', errorMessages);
    
    // Check if we can see the admin sessions page content
    const adminSessionsPage = page.locator('[data-testid="admin-sessions-page"]');
    const isVisible = await adminSessionsPage.isVisible();
    console.log('Admin sessions page visible:', isVisible);
    
    // Check if we can see any role-related content
    const roleContent = await page.locator('text=admin, text=Admin, text=Training Sessions').allTextContents();
    console.log('Role-related content:', roleContent);
  });
});
