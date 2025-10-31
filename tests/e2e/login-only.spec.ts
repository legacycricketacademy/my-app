import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.PUBLIC_BASE_URL || 'https://cricket-academy-app.onrender.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

test.describe('Login Only - E2E Test (Mobile & Desktop)', () => {
  // Desktop test (1280x720)
  test('should login via main endpoint and reach dashboard (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    console.log('🧪 [DESKTOP] Starting login test against:', BASE_URL);
    
    // Navigate to login page
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    // Wait for email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    // Fill in credentials
    await emailInput.fill(ADMIN_EMAIL);
    
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first();
    await passwordInput.fill(ADMIN_PASSWORD);
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/login-desktop-before-submit.png', fullPage: true });
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard (success) or still on auth page (failure)
    const currentUrl = page.url();
    console.log('📍 [DESKTOP] Current URL after login attempt:', currentUrl);
    
    // Take screenshot after attempt
    await page.screenshot({ path: 'test-results/login-desktop-after-submit.png', fullPage: true });
    
    // Check for success indicators
    const isDashboard = currentUrl.includes('/dashboard');
    const hasError = await page.locator('text=/error|failed|invalid/i').first().isVisible().catch(() => false);
    
    if (isDashboard) {
      console.log('✅ [DESKTOP] Login successful - reached dashboard');
      // Take final screenshot on dashboard
      await page.screenshot({ path: 'test-results/login-desktop-success.png', fullPage: true });
      expect(currentUrl).toContain('/dashboard');
    } else if (hasError) {
      console.log('❌ [DESKTOP] Login failed with error message');
      const errorText = await page.locator('text=/error|failed|invalid/i').first().textContent();
      console.log('Error message:', errorText);
      await page.screenshot({ path: 'test-results/login-desktop-failed.png', fullPage: true });
      throw new Error(`Login failed: ${errorText || 'Unknown error'}`);
    } else {
      // Still on login page - wait a bit more for navigation
      console.log('⏳ [DESKTOP] Still on login page, waiting for navigation...');
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ [DESKTOP] Navigated to dashboard after delay');
        await page.screenshot({ path: 'test-results/login-desktop-success.png', fullPage: true });
        expect(finalUrl).toContain('/dashboard');
      } else {
        console.log('❌ [DESKTOP] Still on login page after wait');
        await page.screenshot({ path: 'test-results/login-desktop-no-navigation.png', fullPage: true });
        throw new Error('Login failed - no navigation to dashboard');
      }
    }
  });

  // Mobile test (375x667 - iPhone SE size)
  test('should login via main endpoint and reach dashboard (Mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('🧪 [MOBILE] Starting login test against:', BASE_URL);
    
    // Navigate to login page
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    
    // Wait for email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    // Fill in credentials
    await emailInput.fill(ADMIN_EMAIL);
    
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first();
    await passwordInput.fill(ADMIN_PASSWORD);
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/login-mobile-before-submit.png', fullPage: true });
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard (success) or still on auth page (failure)
    const currentUrl = page.url();
    console.log('📍 [MOBILE] Current URL after login attempt:', currentUrl);
    
    // Take screenshot after attempt
    await page.screenshot({ path: 'test-results/login-mobile-after-submit.png', fullPage: true });
    
    // Check for success indicators
    const isDashboard = currentUrl.includes('/dashboard');
    const hasError = await page.locator('text=/error|failed|invalid/i').first().isVisible().catch(() => false);
    
    if (isDashboard) {
      console.log('✅ [MOBILE] Login successful - reached dashboard');
      // Take final screenshot on dashboard
      await page.screenshot({ path: 'test-results/login-mobile-success.png', fullPage: true });
      expect(currentUrl).toContain('/dashboard');
    } else if (hasError) {
      console.log('❌ [MOBILE] Login failed with error message');
      const errorText = await page.locator('text=/error|failed|invalid/i').first().textContent();
      console.log('Error message:', errorText);
      await page.screenshot({ path: 'test-results/login-mobile-failed.png', fullPage: true });
      throw new Error(`Login failed: ${errorText || 'Unknown error'}`);
    } else {
      // Still on login page - wait a bit more for navigation
      console.log('⏳ [MOBILE] Still on login page, waiting for navigation...');
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ [MOBILE] Navigated to dashboard after delay');
        await page.screenshot({ path: 'test-results/login-mobile-success.png', fullPage: true });
        expect(finalUrl).toContain('/dashboard');
      } else {
        console.log('❌ [MOBILE] Still on login page after wait');
        await page.screenshot({ path: 'test-results/login-mobile-no-navigation.png', fullPage: true });
        throw new Error('Login failed - no navigation to dashboard');
      }
    }
  });

  // API test for auth login endpoint
  test('should verify auth login endpoint works via API', async ({ request }) => {
    console.log('🧪 [API] Testing /api/auth/login endpoint directly');
    
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      headers: { 'Content-Type': 'application/json' },
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBe(ADMIN_EMAIL);
    
    console.log('✅ [API] Auth login endpoint works');
  });
});

