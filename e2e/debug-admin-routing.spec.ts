import { test, expect } from '@playwright/test';

test('debug admin routing', async ({ page }) => {
  // Login as admin
  await page.goto('http://localhost:3000/auth');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForLoadState('networkidle');
  
  console.log('Admin user URL after login:', page.url());
  
  // Check what's on the admin dashboard
  const bodyText = await page.textContent('body');
  console.log('Admin dashboard content (first 500 chars):', bodyText?.substring(0, 500));
  
  // Try to navigate to admin sessions page directly
  await page.goto('http://localhost:3000/admin/sessions');
  await page.waitForLoadState('networkidle');
  
  console.log('Admin sessions URL:', page.url());
  
  // Check if we get redirected away
  const currentUrl = page.url();
  if (currentUrl.includes('/admin/sessions')) {
    console.log('Successfully on admin sessions page');
    
    // Check for the admin sessions content
    const sessionsBodyText = await page.textContent('body');
    console.log('Admin sessions content (first 500 chars):', sessionsBodyText?.substring(0, 500));
    
    // Check for data-testid attributes
    const testIdElements = await page.locator('[data-testid]').all();
    console.log('Elements with data-testid:', testIdElements.length);
    for (let i = 0; i < testIdElements.length; i++) {
      const testId = await testIdElements[i].getAttribute('data-testid');
      const tagName = await testIdElements[i].evaluate(el => el.tagName);
      console.log(`Element ${i}: <${tagName}> data-testid="${testId}"`);
    }
  } else {
    console.log('Redirected away from admin sessions page to:', currentUrl);
  }
});
