import { test, expect } from '@playwright/test';

test.describe('Simple Authentication Test', () => {
  test('can access auth page and login', async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });
    // Go to auth page with full URL
    await page.goto('http://localhost:3000/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the auth page
    await expect(page.locator('h2')).toContainText('Legacy Cricket Academy');
    
    // Fill in admin credentials
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3000/');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/auth-test.png' });
    
    // Log page content for debugging
    const content = await page.content();
    console.log('Page content:', content.substring(0, 1000));
    
    // Check for console errors
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    console.log('Console logs:', logs);
    
    // Wait a bit more for auth to complete
    await page.waitForTimeout(2000);
    
    // Should see dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
