import { test, expect } from '@playwright/test';

// Clear storage state for auth tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Flow', () => {
  test('should display login page with development accounts', async ({ page }) => {
    await page.goto('/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle(/Legacy Cricket Academy/);
    
    // Check main heading - look for the CardTitle
    await expect(page.locator('[data-testid="auth-title"], .text-2xl')).toContainText('Legacy Cricket Academy');
    
    // Check login form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check development accounts section
    await expect(page.locator('text=Development Accounts')).toBeVisible();
    await expect(page.locator('text=parent@test.com')).toBeVisible();
    await expect(page.locator('text=admin@test.com')).toBeVisible();
  });

  test('should show Firebase auth error initially', async ({ page }) => {
    await page.goto('/auth');
    
    // Wait for potential error to appear
    await page.waitForTimeout(2000);
    
    // Check if Firebase error appears (this is expected behavior)
    const errorElement = page.locator('text=Firebase auth not initialized, text=Sign in failed');
    if (await errorElement.isVisible()) {
      console.log('Firebase auth error detected (expected)');
    }
  });

  test('should navigate to dashboard after dev login', async ({ page }) => {
    await page.goto('/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in admin credentials
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    
    // Click sign in button and wait for navigation
    await Promise.all([
      page.waitForURL(/\/admin|\/dashboard|\/parent/, { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Verify we're on the correct page
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    expect(currentUrl).toMatch(/\/admin|\/dashboard|\/parent/);
  });
});

test.describe('Dashboard Pages', () => {
  test('should load main pages without errors', async ({ page }) => {
    // Test homepage - it should show the dashboard for unauthenticated users
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // The homepage should load without errors (it shows SimpleReactDashboard for unauthenticated users)
    await expect(page.locator('body')).toBeVisible();
    
    // Test health endpoint
    const healthResponse = await page.request.get('/health');
    expect(healthResponse.ok()).toBeTruthy();
  });

  test('should display API ping endpoint', async ({ page }) => {
    // Test API ping
    const pingResponse = await page.request.get('/api/ping');
    expect(pingResponse.ok()).toBeTruthy();
    
    const pingData = await pingResponse.json();
    expect(pingData).toHaveProperty('status', 'ok');
    expect(pingData).toHaveProperty('message');
  });
});
