import { test, expect } from '@playwright/test';

test('debug console errors', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  // Login as parent
  await page.goto('http://localhost:3000/auth');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'parent@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('http://localhost:3000/');
  
  // Wait for content to load
  await page.waitForLoadState('networkidle');
  
  // Check if there are any JavaScript errors
  const errors = await page.evaluate(() => {
    return window.console.error;
  });
  
  console.log('Console errors:', errors);
});
