import { test, expect } from '@playwright/test';

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'parent@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('sign out redirects to auth page', async ({ page }) => {
    // Verify we're on dashboard
    await expect(page.locator('h1.heading:has-text("Dashboard")')).toBeVisible();
    
    // Click on user avatar to open dropdown
    await page.click('button[aria-haspopup="menu"]');
    
    // Click sign out
    await page.click('text=Sign out');
    
    // Should be redirected to auth page
    await expect(page).toHaveURL('/auth');
    
    // Verify auth page is shown
    await expect(page.locator('h1:has-text("Legacy Cricket Academy")')).toBeVisible();
  });

  test('sign out clears user state', async ({ page }) => {
    // Verify role badge is visible
    await expect(page.getByTestId('role-badge')).toHaveText('Parent');
    
    // Sign out
    await page.click('button[aria-haspopup="menu"]');
    await page.click('text=Sign out');
    
    // Should be on auth page
    await expect(page).toHaveURL('/auth');
    
    // Try to navigate to dashboard - should redirect back to auth
    await page.goto('/');
    await expect(page).toHaveURL('/auth');
  });

  test('sign out and login again works', async ({ page }) => {
    // Sign out
    await page.click('button[aria-haspopup="menu"]');
    await page.click('text=Sign out');
    await expect(page).toHaveURL('/auth');
    
    // Login again
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1.heading:has-text("Dashboard")')).toBeVisible();
    
    // Verify role badge shows "Admin"
    await expect(page.getByTestId('role-badge')).toHaveText('Admin');
  });
});
