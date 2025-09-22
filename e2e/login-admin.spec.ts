/**
 * E2E Test: Login as Admin
 * Tests admin authentication and admin area access
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Login Flow', () => {
  test('should login as admin and see admin area', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    
    // Fill in admin credentials
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/');
    
    // Check that role badge shows "Admin"
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('Admin');
    
    // Navigate to admin area
    await page.goto('/admin');
    
    // Check that we can access admin area
    await expect(page.locator('h1')).toContainText('Admin Panel');
    await expect(page.locator('text=Admin-only content goes here')).toBeVisible();
  });

  test('should deny access to admin area for parent users', async ({ page }) => {
    // Login as parent first
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'parent@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Try to access admin area
    await page.goto('/admin');
    
    // Should see access denied message
    await expect(page.locator('h2')).toContainText('Access Denied');
    await expect(page.locator('text=You need admin permissions')).toBeVisible();
  });
});
