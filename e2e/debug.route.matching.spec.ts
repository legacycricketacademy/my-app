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
    
    // Try to navigate directly to admin sessions
    await page.goto('http://localhost:3000/admin/sessions');
    await page.waitForLoadState('networkidle');
    
    console.log('After navigating to /admin/sessions, URL is:', page.url());
    
    // Check what's actually rendered
    const bodyText = await page.textContent('body');
    console.log('Page body contains:', bodyText?.substring(0, 500));
    
    // Check if any admin sessions content is present
    const hasSessionManagement = bodyText?.includes('Session Management');
    const hasTrainingSessions = bodyText?.includes('Training Sessions');
    console.log('Has Session Management:', hasSessionManagement);
    console.log('Has Training Sessions:', hasTrainingSessions);
  });
});
