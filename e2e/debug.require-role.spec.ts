import { test, expect } from '@playwright/test';

test.describe('Debug RequireRole', () => {
  test('debug RequireRole component', async ({ page }) => {
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
    
    // Check what URL we're on after login
    console.log('After login, URL is:', page.url());
    
    // Try to go to admin sessions
    await page.goto('http://localhost:3000/admin/sessions');
    await page.waitForTimeout(2000); // Wait 2 seconds to see what happens
    
    console.log('After navigating to /admin/sessions, URL is:', page.url());
    
    // Check if we can see any content
    const bodyText = await page.textContent('body');
    console.log('Page body contains:', bodyText?.substring(0, 200));
  });
});
