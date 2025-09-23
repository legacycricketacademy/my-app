import { test, expect } from '@playwright/test';

test('debug user object', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });

  // Login as parent
  await page.goto('http://localhost:3000/auth');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'parent@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForLoadState('networkidle');
  
  // Check the user object in localStorage
  const userFromStorage = await page.evaluate(() => {
    return localStorage.getItem('auth:user');
  });
  console.log('User from localStorage:', userFromStorage);
  
  // Check what the app thinks the user is
  const userInfo = await page.evaluate(() => {
    // Try to access the user object from the global scope or React context
    return {
      userAgent: navigator.userAgent,
      localStorage: localStorage.getItem('auth:user'),
      // Try to find any user-related data in the DOM
      bodyText: document.body.textContent?.substring(0, 200)
    };
  });
  console.log('User info:', userInfo);
  
  // Check the current URL
  console.log('Current URL:', page.url());
});
