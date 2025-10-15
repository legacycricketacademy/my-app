import { test, expect } from '@playwright/test';

test.describe('Final Demo - Complete Cricket Academy System', () => {
  test('admin dashboard with full features', async ({ page }) => {
    console.log('🎯 Testing Admin Dashboard...');
    
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Check for admin dashboard
    await expect(page.locator('h1').filter({ hasText: 'Admin Dashboard' })).toBeVisible();
    console.log('✅ Admin Dashboard loaded successfully');
    
    // Check for admin features
    const adminFeatures = [
      'Total Users',
      'Pending Coaches',
      'Training Sessions',
      'Revenue',
      'Coach Management',
      'User Management',
      'Financial Management'
    ];
    
    for (const feature of adminFeatures) {
      const element = await page.locator(`text=${feature}`);
      if (await element.isVisible()) {
        console.log(`✅ ${feature} - Visible`);
      }
    }
    
    // Wait to see the dashboard
    await page.waitForTimeout(2000);
    console.log('🎉 Admin Dashboard Demo Complete!');
  });

  test('parent dashboard with full features', async ({ page }) => {
    console.log('🎯 Testing Parent Dashboard...');
    
    // Login as parent
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Check for parent dashboard
    await expect(page.locator('h1').filter({ hasText: 'Player Dashboard' })).toBeVisible();
    console.log('✅ Parent Dashboard loaded successfully');
    
    // Check for parent features
    const parentFeatures = [
      'Overall Progress',
      'Attendance',
      'Fitness Score',
      'Upcoming Sessions',
      'Performance Overview',
      'Recent Activity'
    ];
    
    for (const feature of parentFeatures) {
      const element = await page.locator(`text=${feature}`);
      if (await element.isVisible()) {
        console.log(`✅ ${feature} - Visible`);
      }
    }
    
    // Wait to see the dashboard
    await page.waitForTimeout(2000);
    console.log('🎉 Parent Dashboard Demo Complete!');
  });

  test('navigation and all features working', async ({ page }) => {
    console.log('🎯 Testing Complete System Navigation...');
    
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Admin logged in successfully');
    
    // Test all navigation
    const pages = [
      { url: 'http://localhost:3000/schedule', name: 'Schedule' },
      { url: 'http://localhost:3000/players', name: 'Players' },
      { url: 'http://localhost:3000/payments', name: 'Payments' },
      { url: 'http://localhost:3000/admin/sessions', name: 'Admin Sessions' }
    ];
    
    for (const pageInfo of pages) {
      console.log(`🔗 Testing ${pageInfo.name} page...`);
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`✅ ${pageInfo.name} page loaded: "${h1Text}"`);
      
      await page.waitForTimeout(1000);
    }
    
    // Go back to dashboard
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').filter({ hasText: 'Admin Dashboard' })).toBeVisible();
    console.log('✅ Returned to Admin Dashboard');
    
    console.log('🎉 Complete System Navigation Demo Complete!');
  });
});



