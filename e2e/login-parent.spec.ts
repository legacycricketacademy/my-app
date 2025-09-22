/**
 * E2E Test: Login as Parent
 * Tests parent authentication and dashboard access
 */

import { test, expect } from '@playwright/test';

test.describe('Parent Login Flow', () => {
  test('should login as parent and see dashboard', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    
    // Check that we're on the auth page
    await expect(page).toHaveTitle(/Legacy Cricket Academy/);
    await expect(page.locator('h1')).toContainText('Legacy Cricket Academy');
    
    // Fill in parent credentials
    await page.fill('input[name="email"]', 'parent@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/');
    
    // Check that we're on the dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check that role badge shows "Parent"
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('Parent');
    
    // Check that dashboard components are visible
    await expect(page.locator('text=Players')).toBeVisible();
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible();
    await expect(page.locator('text=Payment Tracker')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Check that error message appears
    await expect(page.locator('text=Sign in failed')).toBeVisible();
    await expect(page.locator('text=Please check your credentials')).toBeVisible();
  });

  test('should redirect to auth when not logged in', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/');
    
    // Should be redirected to auth page
    await page.waitForURL('/auth');
    await expect(page.locator('h1')).toContainText('Legacy Cricket Academy');
  });
});
