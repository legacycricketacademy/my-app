import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.clear());
  });

  test('parent user can login and access dashboard', async ({ page }) => {
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
    
    // Wait for the dashboard content to load (not just "Preparing your session...")
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Dashboard') || bodyText.includes('Player Dashboard') || bodyText.includes('Admin Dashboard');
    }, { timeout: 10000 });
    
    // Should see dashboard content - use more specific selector
    await expect(page.locator('h1').first()).toContainText('Dashboard');
  });

  test('admin user can login and access admin pages', async ({ page }) => {
    // Go to auth page
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Fill in admin credentials
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3000/');
    
    // Wait for the dashboard content to load (not just "Preparing your session...")
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Dashboard') || bodyText.includes('Player Dashboard') || bodyText.includes('Admin Dashboard');
    }, { timeout: 10000 });
    
    // Should see dashboard content - use more specific selector
    await expect(page.locator('h1').first()).toContainText('Dashboard');
    
    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    
    // Wait for admin content to load
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Admin') || bodyText.includes('Admin Panel') || bodyText.includes('Admin Dashboard');
    }, { timeout: 10000 });
    
    // Should see admin content - use more specific selector
    await expect(page.locator('h1').first()).toContainText('Admin Panel');
  });

  test('parent user cannot access admin pages', async ({ page }) => {
    // Login as parent
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3000/');
    
    // Try to access admin page
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    
    // Should see access denied - use more specific selector
    await expect(page.locator('h1').first()).toContainText('Access Denied');
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should see error message
    await expect(page.locator('.text-red-600')).toContainText('Invalid credentials');
    
    // Should stay on auth page
    await expect(page).toHaveURL('http://localhost:3000/auth');
  });

  test('session persists across page refresh', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3000/');
    
    // Wait for the dashboard content to load initially
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Dashboard') || bodyText.includes('Player Dashboard') || bodyText.includes('Admin Dashboard');
    }, { timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for content to load after refresh
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Dashboard') || bodyText.includes('Player Dashboard') || bodyText.includes('Admin Dashboard');
    }, { timeout: 10000 });
    
    // Should still be on dashboard (not redirected to auth)
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('h1').first()).toContainText('Dashboard');
  });

  test('unauthenticated user is redirected to auth', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to auth page
    await expect(page).toHaveURL('http://localhost:3000/auth');
    await expect(page.locator('h2')).toContainText('Legacy Cricket Academy');
  });

  test('test credentials are displayed', async ({ page }) => {
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Should see test credentials
    await expect(page.locator('text=Test credentials:')).toBeVisible();
    await expect(page.locator('text=Admin: admin@test.com / password123')).toBeVisible();
    await expect(page.locator('text=Parent: parent@test.com / password123')).toBeVisible();
  });
});

// Helper function for login in other tests
export async function loginAs(page: any, userType: 'admin' | 'parent') {
  const credentials = {
    admin: { email: 'admin@test.com', password: 'password123' },
    parent: { email: 'parent@test.com', password: 'password123' }
  };
  
  await page.goto('http://localhost:3000/auth');
  await page.fill('input[type="email"]', credentials[userType].email);
  await page.fill('input[type="password"]', credentials[userType].password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await expect(page).toHaveURL('http://localhost:3000/');
}
