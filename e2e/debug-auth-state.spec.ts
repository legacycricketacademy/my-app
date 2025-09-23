import { test, expect } from '@playwright/test';

test('debug auth state', async ({ page }) => {
  // Login as admin
  await page.goto('http://localhost:3000/auth');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForLoadState('networkidle');
  
  // Check the user object in localStorage
  const userFromStorage = await page.evaluate(() => {
    return localStorage.getItem('auth:user');
  });
  console.log('Admin user from localStorage:', userFromStorage);
  
  // Check if auth is initialized
  const authState = await page.evaluate(() => {
    // Try to access the auth state from the global scope
    return {
      localStorage: localStorage.getItem('auth:user'),
      // Check if there are any auth-related functions available
      hasAuth: typeof window !== 'undefined' && 'auth' in window,
      // Check if there are any console messages about auth
      bodyText: document.body.textContent?.substring(0, 200)
    };
  });
  console.log('Auth state:', authState);
  
  // Try to access the admin sessions page and wait for any redirects
  await page.goto('http://localhost:3000/admin/sessions');
  
  // Wait a bit to see if there are any redirects
  await page.waitForTimeout(2000);
  
  console.log('Final URL after waiting:', page.url());
  
  // Check if we can see any auth-related messages
  const finalBodyText = await page.textContent('body');
  console.log('Final body text (first 500 chars):', finalBodyText?.substring(0, 500));
  
  // Check if we can see any console messages about auth
  const consoleMessages = await page.evaluate(() => {
    // This won't work in headless mode, but let's try
    return 'Console messages not accessible in headless mode';
  });
  console.log('Console messages:', consoleMessages);
});
