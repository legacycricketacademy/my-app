import { test, expect } from '@playwright/test';

test('debug dashboard content', async ({ page }) => {
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
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
  
  // Get all elements with data-testid
  const testIdElements = await page.locator('[data-testid]').all();
  console.log('Found elements with data-testid:');
  for (const element of testIdElements) {
    const testId = await element.getAttribute('data-testid');
    const tagName = await element.evaluate(el => el.tagName);
    const text = await element.textContent();
    console.log(`- ${testId}: <${tagName}> "${text?.substring(0, 50)}..."`);
  }
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get all h1 elements
  const h1Elements = await page.locator('h1').all();
  console.log('H1 elements:');
  for (let i = 0; i < h1Elements.length; i++) {
    const text = await h1Elements[i].textContent();
    const testId = await h1Elements[i].getAttribute('data-testid');
    console.log(`  H1 ${i}: "${text}" (testid: ${testId})`);
  }
  
  // Check if dashboard title exists
  const dashboardTitle = page.locator('[data-testid="dashboard-title"]');
  const count = await dashboardTitle.count();
  console.log(`Dashboard title count: ${count}`);
  
  if (count > 0) {
    console.log('Dashboard title is visible:', await dashboardTitle.isVisible());
  }
});
