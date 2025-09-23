import { test, expect } from '@playwright/test';

test.describe('Debug Auth Store', () => {
  test('debug auth store initialization', async ({ page }) => {
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
    
    // Wait a bit to see what happens
    await page.waitForTimeout(2000);
    
    // Check what URL we're on after login
    console.log('After login, URL is:', page.url());
    
    // Check if we can see any content
    const bodyText = await page.textContent('body');
    console.log('Page body contains:', bodyText?.substring(0, 200));
  });
});
