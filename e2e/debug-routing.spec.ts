import { test, expect } from '@playwright/test';

test('debug routing and components', async ({ page }) => {
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
  
  // Check the current URL
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  
  // Check what component is being rendered
  const bodyText = await page.textContent('body');
  console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
  
  // Check for specific text that would indicate which dashboard is being used
  const hasWelcomeText = bodyText?.includes('Welcome,');
  const hasPlayerDashboardText = bodyText?.includes('Player Dashboard');
  const hasAdminDashboardText = bodyText?.includes('Admin Dashboard');
  
  console.log('Has "Welcome," text:', hasWelcomeText);
  console.log('Has "Player Dashboard" text:', hasPlayerDashboardText);
  console.log('Has "Admin Dashboard" text:', hasAdminDashboardText);
  
  // Check for any h1 elements
  const h1Elements = await page.locator('h1').all();
  console.log('H1 elements found:', h1Elements.length);
  for (let i = 0; i < h1Elements.length; i++) {
    const text = await h1Elements[i].textContent();
    console.log(`H1 ${i}: "${text}"`);
  }
  
  // Check for any data-testid attributes
  const testIdElements = await page.locator('[data-testid]').all();
  console.log('Elements with data-testid:', testIdElements.length);
  for (let i = 0; i < testIdElements.length; i++) {
    const testId = await testIdElements[i].getAttribute('data-testid');
    const tagName = await testIdElements[i].evaluate(el => el.tagName);
    console.log(`Element ${i}: <${tagName}> data-testid="${testId}"`);
  }
});
