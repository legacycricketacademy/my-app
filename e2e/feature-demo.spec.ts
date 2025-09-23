import { test, expect } from '@playwright/test';

test.describe('Feature Demo - Cricket Academy', () => {
  test('admin dashboard features', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Look for admin-specific features
    console.log('=== ADMIN DASHBOARD FEATURES ===');
    
    // Check if we can see any admin cards or features
    const pageContent = await page.content();
    console.log('Page contains "admin":', pageContent.includes('admin'));
    console.log('Page contains "Admin":', pageContent.includes('Admin'));
    console.log('Page contains "players":', pageContent.includes('players'));
    console.log('Page contains "schedule":', pageContent.includes('schedule'));
    console.log('Page contains "payments":', pageContent.includes('payments'));
    
    // Wait to see the dashboard
    await page.waitForTimeout(3000);
  });

  test('parent dashboard features', async ({ page }) => {
    // Login as parent
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Look for parent-specific features
    console.log('=== PARENT DASHBOARD FEATURES ===');
    
    // Check if we can see any parent cards or features
    const pageContent = await page.content();
    console.log('Page contains "parent":', pageContent.includes('parent'));
    console.log('Page contains "Parent":', pageContent.includes('Parent'));
    console.log('Page contains "schedule":', pageContent.includes('schedule'));
    console.log('Page contains "notifications":', pageContent.includes('notifications'));
    console.log('Page contains "payments":', pageContent.includes('payments'));
    
    // Wait to see the dashboard
    await page.waitForTimeout(3000);
  });

  test('navigation and routing', async ({ page }) => {
    // Login as admin first
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    console.log('=== NAVIGATION TESTING ===');
    
    // Try to navigate to different pages
    const pagesToTest = [
      { url: 'http://localhost:3000/schedule', name: 'Schedule' },
      { url: 'http://localhost:3000/admin/sessions', name: 'Admin Sessions' },
      { url: 'http://localhost:3000/players', name: 'Players' },
      { url: 'http://localhost:3000/payments', name: 'Payments' }
    ];
    
    for (const pageInfo of pagesToTest) {
      console.log(`Testing navigation to: ${pageInfo.name}`);
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      // Check if page loaded (not 404)
      const title = await page.title();
      const h1Text = await page.locator('h1').first().textContent().catch(() => 'No h1 found');
      
      console.log(`  - Title: ${title}`);
      console.log(`  - H1: ${h1Text}`);
      console.log(`  - URL: ${page.url()}`);
      
      await page.waitForTimeout(1000);
    }
  });
});

