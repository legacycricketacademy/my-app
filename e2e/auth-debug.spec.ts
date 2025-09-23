import { test, expect } from '@playwright/test';

test.describe('Auth Debug Test', () => {
  test('can access auth page and see form', async ({ page }) => {
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
    
    // Check that the form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check that test credentials are displayed
    await expect(page.locator('text=Test credentials:')).toBeVisible();
  });
});

