import { test, expect } from '@playwright/test';

test('debug dashboard content detailed', async ({ page }) => {
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
  
  // Get the page source to see what's actually being rendered
  const pageContent = await page.content();
  console.log('Page content length:', pageContent.length);
  
  // Look for dashboard-title in the HTML
  const hasDashboardTitle = pageContent.includes('data-testid="dashboard-title"');
  console.log('Has dashboard-title testid:', hasDashboardTitle);
  
  // Look for any data-testid attributes
  const testIdMatches = pageContent.match(/data-testid="[^"]*"/g);
  console.log('All data-testid attributes found:', testIdMatches);
  
  // Check if the dashboard component is loading
  const hasDashboardCards = pageContent.includes('stats-card') || pageContent.includes('players-card');
  console.log('Has dashboard cards:', hasDashboardCards);
  
  // Check if the TID import is working by looking for the actual testid values
  const expectedTestIds = [
    'dashboard-title',
    'stats-card',
    'players-card',
    'fitness-card',
    'meal-plan-card',
    'payment-card',
    'schedule-card',
    'announcements-card'
  ];
  
  for (const testId of expectedTestIds) {
    const found = pageContent.includes(`data-testid="${testId}"`);
    console.log(`${testId}: ${found ? '✓' : '✗'}`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-dashboard-detailed.png', fullPage: true });
});
