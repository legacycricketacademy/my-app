import { test, expect } from '@playwright/test';

test('debug hasRole function', async ({ page }) => {
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
  
  // Check what the app thinks the user is
  const userInfo = await page.evaluate(() => {
    return {
      userAgent: navigator.userAgent,
      localStorage: localStorage.getItem('auth:user'),
      // Try to find any user-related data in the DOM
      bodyText: document.body.textContent?.substring(0, 200)
    };
  });
  console.log('Admin user info:', userInfo);
  
  // Check the current URL
  console.log('Current URL:', page.url());
  
  // Try to access the admin page directly
  await page.goto('http://localhost:3000/admin');
  await page.waitForLoadState('networkidle');
  
  console.log('Admin page URL:', page.url());
  
  // Check if we can see admin content
  const adminBodyText = await page.textContent('body');
  const hasAdminContent = adminBodyText?.includes('Admin Panel') || adminBodyText?.includes('Admin Dashboard');
  console.log('Has admin content:', hasAdminContent);
  
  // Try to access admin sessions page
  await page.goto('http://localhost:3000/admin/sessions');
  await page.waitForLoadState('networkidle');
  
  console.log('Admin sessions page URL:', page.url());
  
  // Check if we can see admin sessions content
  const sessionsBodyText = await page.textContent('body');
  const hasSessionsContent = sessionsBodyText?.includes('Session Management') || sessionsBodyText?.includes('admin-sessions-page');
  console.log('Has sessions content:', hasSessionsContent);
  
  // Check if we can see access denied message
  const hasAccessDenied = sessionsBodyText?.includes('Access Denied');
  console.log('Has access denied message:', hasAccessDenied);
  
  // Check if we can see the RequireRole component content
  const hasRequireRoleContent = sessionsBodyText?.includes('Preparing your session') || sessionsBodyText?.includes('You don\'t have permission');
  console.log('Has RequireRole component content:', hasRequireRoleContent);
});
