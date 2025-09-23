import { test, expect } from '@playwright/test';

test.describe('Login Demo - Admin and Parent', () => {
  test('admin login and dashboard access', async ({ page }) => {
    // Go to auth page
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the auth page
    await expect(page.locator('h2')).toContainText('Legacy Cricket Academy');
    
    // Fill in admin credentials
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3000/');
    
    // Should see dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Wait a bit to see the dashboard
    await page.waitForTimeout(2000);
  });

  test('parent login and dashboard access', async ({ page }) => {
    // Go to auth page
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the auth page
    await expect(page.locator('h2')).toContainText('Legacy Cricket Academy');
    
    // Fill in parent credentials
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3000/');
    
    // Should see dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Wait a bit to see the dashboard
    await page.waitForTimeout(2000);
  });

  test('test credentials are displayed on auth page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Should see test credentials
    await expect(page.locator('text=Test credentials:')).toBeVisible();
    await expect(page.locator('text=Admin: admin@test.com / password123')).toBeVisible();
    await expect(page.locator('text=Parent: parent@test.com / password123')).toBeVisible();
    
    // Wait to see the credentials
    await page.waitForTimeout(2000);
  });
});

