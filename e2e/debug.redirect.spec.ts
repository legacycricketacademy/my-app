import { test, expect } from '@playwright/test';

test.describe('Debug Redirect Loop', () => {
  test('debug admin redirect', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Go to auth page first
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Login as admin
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Check what URL we're on after login
    console.log('After login, URL is:', page.url());
    
    // Try to go to admin sessions
    await page.goto('http://localhost:3000/admin/sessions');
    await page.waitForTimeout(2000); // Wait 2 seconds to see what happens
    
    console.log('After navigating to /admin/sessions, URL is:', page.url());
    
    // Check if we're in a redirect loop by looking at the page content
    const bodyText = await page.textContent('body');
    console.log('Page body contains:', bodyText?.substring(0, 200));
    
    // Check for any error messages
    const errorElements = await page.locator('[data-testid*="error"], .error, [class*="error"]').all();
    for (const element of errorElements) {
      console.log('Error element found:', await element.textContent());
    }
  });
});
