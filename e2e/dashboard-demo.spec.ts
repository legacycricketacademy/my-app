import { test, expect } from '@playwright/test';

test.describe('Dashboard Features Demo', () => {
  test('admin dashboard with full features', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Check for admin dashboard title
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Check for admin-specific features
    console.log('=== ADMIN DASHBOARD FEATURES ===');
    
    // Look for stats cards
    const statsCards = await page.locator('[class*="grid"][class*="gap-6"]').first();
    await expect(statsCards).toBeVisible();
    
    // Look for quick action cards
    const actionCards = await page.locator('text=Coach Management');
    await expect(actionCards).toBeVisible();
    
    // Check for email status banner
    const emailBanner = await page.locator('text=Email Service Disabled');
    if (await emailBanner.isVisible()) {
      console.log('✓ Email status banner visible');
    }
    
    // Wait to see the full dashboard
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/admin-dashboard.png' });
    
    console.log('✓ Admin dashboard loaded with all features');
  });

  test('parent dashboard with full features', async ({ page }) => {
    // Login as parent
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Check for parent dashboard title
    await expect(page.locator('h1')).toContainText('Player Dashboard');
    
    // Check for parent-specific features
    console.log('=== PARENT DASHBOARD FEATURES ===');
    
    // Look for stats cards
    const statsCards = await page.locator('text=Overall Progress');
    await expect(statsCards).toBeVisible();
    
    // Look for upcoming sessions table
    const sessionsTable = await page.locator('text=Upcoming Sessions');
    await expect(sessionsTable).toBeVisible();
    
    // Look for performance overview
    const performanceSection = await page.locator('text=Performance Overview');
    await expect(performanceSection).toBeVisible();
    
    // Wait to see the full dashboard
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/parent-dashboard.png' });
    
    console.log('✓ Parent dashboard loaded with all features');
  });

  test('dashboard navigation and features', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    console.log('=== DASHBOARD NAVIGATION ===');
    
    // Check admin dashboard features
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Look for specific admin features
    const features = [
      'Total Users',
      'Pending Coaches', 
      'Training Sessions',
      'Revenue',
      'Coach Management',
      'User Management',
      'Financial Management'
    ];
    
    for (const feature of features) {
      const element = await page.locator(`text=${feature}`);
      if (await element.isVisible()) {
        console.log(`✓ ${feature} - Visible`);
      } else {
        console.log(`✗ ${feature} - Not visible`);
      }
    }
    
    // Test navigation to other pages
    console.log('\n=== TESTING NAVIGATION ===');
    
    // Go to schedule page
    await page.goto('http://localhost:3000/schedule');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Schedule');
    console.log('✓ Schedule page accessible');
    
    // Go to players page
    await page.goto('http://localhost:3000/players');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Players');
    console.log('✓ Players page accessible');
    
    // Go to payments page
    await page.goto('http://localhost:3000/payments');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Payments');
    console.log('✓ Payments page accessible');
    
    // Go back to dashboard
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    console.log('✓ Dashboard accessible');
  });
});



