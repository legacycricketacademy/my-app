import { test, expect } from '@playwright/test';

test.describe('Debug Account Page', () => {
  test('check account page loads', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`Console Error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to account page
    await page.goto('http://localhost:3000/account');
    await page.waitForLoadState('networkidle');
    
    // Check what's on the page
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    console.log('Page content preview:', pageContent.substring(0, 1000));
    
    // Check for any h1 elements
    const h1Count = await page.locator('h1').count();
    console.log('Number of h1 elements:', h1Count);
    
    if (h1Count > 0) {
      for (let i = 0; i < h1Count; i++) {
        const h1Text = await page.locator('h1').nth(i).textContent();
        console.log(`H1 ${i}:`, h1Text);
      }
    }
    
    // Check for account page elements
    const accountTabs = await page.locator('[data-testid^="account-tab-"]').count();
    console.log('Number of account tabs:', accountTabs);
    
    // Print console errors
    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach(error => console.log(error));
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/account-debug.png' });
    
    // The page should have some content
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});

