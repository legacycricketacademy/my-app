import { test, expect } from '@playwright/test';
import { loginAs, logout, expectOneSidebar, ADMIN_CREDENTIALS, PARENT_CREDENTIALS } from '../utils/auth';

// Clear storage state for login tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login Flow', () => {
  test('should reach /auth and login with admin credentials', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    
    // Verify login page elements
    await expect(page.getByText('Legacy Cricket Academy')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Login as admin
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    
    // Should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify only one sidebar
    await expectOneSidebar(page);
  });

  test('should login as parent and land on parent dashboard', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    
    // Login as parent
    await loginAs(page, PARENT_CREDENTIALS.email, PARENT_CREDENTIALS.password);
    
    // Should land on parent dashboard (parents are redirected to /parent/kids)
    await expect(page).toHaveURL(/\/(dashboard|parent)/);
    
    // Verify only one sidebar
    await expectOneSidebar(page);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Logout
    await logout(page);
    
    // Should be back on auth page
    await expect(page).toHaveURL('/auth');
  });
});
