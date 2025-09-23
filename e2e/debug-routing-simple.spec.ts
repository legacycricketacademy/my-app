import { test, expect } from '@playwright/test';

test('debug routing simple', async ({ page }) => {
  // Login as parent
  await page.goto('http://localhost:3000/auth');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'parent@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForLoadState('networkidle');
  
  console.log('Final URL:', page.url());
  
  // Try to navigate to the parent dashboard directly
  await page.goto('http://localhost:3000/dashboard/parent');
  await page.waitForLoadState('networkidle');
  
  console.log('Parent dashboard URL:', page.url());
  
  // Check if we get redirected away
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard/parent')) {
    console.log('Successfully on parent dashboard');
    
    // Check for the enhanced dashboard content
    const bodyText = await page.textContent('body');
    const hasWelcomeText = bodyText?.includes('Welcome,');
    console.log('Has "Welcome," text:', hasWelcomeText);
    
    // Check for data-testid attributes
    const testIdElements = await page.locator('[data-testid]').all();
    console.log('Elements with data-testid:', testIdElements.length);
    for (let i = 0; i < testIdElements.length; i++) {
      const testId = await testIdElements[i].getAttribute('data-testid');
      const tagName = await testIdElements[i].evaluate(el => el.tagName);
      console.log(`Element ${i}: <${tagName}> data-testid="${testId}"`);
    }
  } else {
    console.log('Redirected away from parent dashboard to:', currentUrl);
  }
});
