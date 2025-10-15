import { test, expect } from '@playwright/test';

test.describe('Simple Demo - New Features', () => {
  test('admin dashboard with user menu and role badge', async ({ page }) => {
    console.log('🎯 Testing Admin Dashboard with New Features...');
    
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
    
    // Check for user menu
    await expect(page.locator('[data-testid="user-menu-trigger"]')).toBeVisible();
    console.log('✅ User menu is visible');
    
    // Check for role badge
    await expect(page.locator('[data-testid="role-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('Admin');
    console.log('✅ Role badge shows "Admin"');
    
    // Click on user menu
    await page.click('[data-testid="user-menu-trigger"]');
    
    // Check that dropdown is open
    await expect(page.locator('[data-testid="user-menu-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu-signout"]')).toBeVisible();
    console.log('✅ User menu dropdown is working');
    
    // Wait to see the dashboard
    await page.waitForTimeout(2000);
    console.log('🎉 Admin Dashboard with New Features Demo Complete!');
  });

  test('parent dashboard with user menu and role badge', async ({ page }) => {
    console.log('🎯 Testing Parent Dashboard with New Features...');
    
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
    
    // Check for user menu
    await expect(page.locator('[data-testid="user-menu-trigger"]')).toBeVisible();
    console.log('✅ User menu is visible');
    
    // Check for role badge
    await expect(page.locator('[data-testid="role-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('Parent');
    console.log('✅ Role badge shows "Parent"');
    
    // Click on user menu
    await page.click('[data-testid="user-menu-trigger"]');
    
    // Check that dropdown is open
    await expect(page.locator('[data-testid="user-menu-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu-signout"]')).toBeVisible();
    console.log('✅ User menu dropdown is working');
    
    // Wait to see the dashboard
    await page.waitForTimeout(2000);
    console.log('🎉 Parent Dashboard with New Features Demo Complete!');
  });

  test('email banner is hidden by default', async ({ page }) => {
    console.log('🎯 Testing Email Banner (Hidden by Default)...');
    
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Banner should not be visible (EMAIL_BANNER defaults to 'off')
    await expect(page.locator('[data-testid="email-banner"]')).not.toBeVisible();
    console.log('✅ Email banner is hidden by default (EMAIL_BANNER=off)');
    
    // Wait to see the dashboard
    await page.waitForTimeout(2000);
    console.log('🎉 Email Banner Test Complete!');
  });

  test('navigation to account page works', async ({ page }) => {
    console.log('🎯 Testing Account Page Navigation...');
    
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Click on user menu
    await page.click('[data-testid="user-menu-trigger"]');
    
    // Click on Profile
    await page.click('[data-testid="user-menu-profile"]');
    
    // Should navigate to account page
    await page.waitForURL('http://localhost:3000/account');
    await expect(page.locator('h1')).toContainText('Account');
    console.log('✅ Account page navigation works');
    
    // Check that role badge is still visible
    await expect(page.locator('[data-testid="role-badge"]')).toBeVisible();
    console.log('✅ Role badge persists on account page');
    
    // Wait to see the page
    await page.waitForTimeout(2000);
    console.log('🎉 Account Page Navigation Test Complete!');
  });
});



