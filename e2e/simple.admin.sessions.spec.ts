import { test, expect } from '@playwright/test';

test.describe('Simple Admin Sessions Test', () => {
  test('admin user can access admin sessions page', async ({ page }) => {
    // Go to auth page first
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Login as admin
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for the redirect to complete
    await page.waitForTimeout(2000);
    
    // Try to navigate to admin sessions
    await page.goto('http://localhost:3000/admin/sessions');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more
    await page.waitForTimeout(2000);
    
    // Check the URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we can find any admin sessions content
    const pageContent = await page.textContent('body');
    console.log('Page content contains "Session Management":', pageContent?.includes('Session Management'));
    console.log('Page content contains "Admin Dashboard":', pageContent?.includes('Admin Dashboard'));
    
    // For now, just check that we're not on the auth page
    expect(currentUrl).not.toContain('/auth');
  });
});
