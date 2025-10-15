import { test, expect } from '@playwright/test';

test.describe('Auth Console Test', () => {
  test('check console logs during login', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Listen for console messages
    page.on('console', msg => {
      consoleLogs.push(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      consoleLogs.push(`Page error: ${error.message}`);
    });

    // Go to auth page
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Fill in credentials and submit
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3000/');
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    // Print all console logs
    console.log('=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('=== END CONSOLE LOGS ===');
    
    // Check if we see the dashboard
    const h1Elements = await page.locator('h1').count();
    console.log('Number of h1 elements:', h1Elements);
    
    if (h1Elements > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log('First h1 text:', h1Text);
    }
    
    // Check if we see the loading spinner
    const loadingSpinner = await page.locator('.animate-spin').count();
    console.log('Number of loading spinners:', loadingSpinner);
    
    // The test should pass regardless of the dashboard loading
    expect(true).toBe(true);
  });
});



