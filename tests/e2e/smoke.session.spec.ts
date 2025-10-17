import { test, expect } from '@playwright/test';
import { loginAs, expectAuthenticated, expectUnauthenticated, ADMIN_CREDENTIALS } from '../utils/auth';

test.describe('Session API', () => {
  test('should return unauthenticated for new session', async ({ page }) => {
    // Check session without logging in
    await page.goto('/auth');
    await expectUnauthenticated(page);
  });

  test('should return authenticated after login', async ({ page }) => {
    // Login
    await page.goto('/auth');
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    
    // Wait for dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Check session
    await expectAuthenticated(page);
    
    // Verify user data is returned
    const response = await page.request.get('/api/session');
    const data = await response.json();
    
    expect(data.user.id).toBeTruthy();
    expect(data.user.role).toBe('admin');
  });

  test('should maintain session across page navigations', async ({ page }) => {
    // Login
    await page.goto('/auth');
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to different pages
    await page.goto('/dashboard/team');
    await expectAuthenticated(page);
    
    await page.goto('/dashboard/schedule');
    await expectAuthenticated(page);
    
    await page.goto('/dashboard/payments');
    await expectAuthenticated(page);
  });
});
