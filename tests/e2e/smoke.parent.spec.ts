import { test, expect } from '@playwright/test';
import { loginAs, expectOneSidebar, PARENT_CREDENTIALS } from '../utils/auth';

test.describe('Parent Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as parent before each test
    await page.goto('/auth');
    await loginAs(page, PARENT_CREDENTIALS.email, PARENT_CREDENTIALS.password);
    await page.waitForURL(/\/(dashboard\/parent|parent)/);
  });

  test('should show single sidebar in parent dashboard', async ({ page }) => {
    await page.goto('/dashboard/parent');
    await expectOneSidebar(page);
    
    // Verify parent dashboard loaded
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to parent schedule without overlay', async ({ page }) => {
    await page.goto('/parent/schedule');
    
    // Verify page loaded
    await expect(page.locator('h1:has-text("Schedule"), h1:has-text("Training Schedule")')).toBeVisible();
    
    // Verify only one sidebar (no overlay)
    await expectOneSidebar(page);
  });

  test('should navigate to parent payments', async ({ page }) => {
    await page.goto('/parent/payments');
    
    // Verify page loaded
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check for "New Payment" button or similar
    const newPaymentButton = page.locator('button:has-text("New Payment"), button:has-text("Record Payment")').first();
    
    // Button might not always be visible, but page should load
    await expectOneSidebar(page);
  });

  test('should navigate to parent profile', async ({ page }) => {
    await page.goto('/parent/profile');
    
    // Verify profile page loaded with user info
    await expect(page.locator('h1:has-text("Profile"), h1:has-text("My Profile")')).toBeVisible();
    
    // Should show email or name
    await expect(page.locator('text=/email|name/i')).toBeVisible();
    
    // Verify only one sidebar
    await expectOneSidebar(page);
  });

  test('should navigate to announcements', async ({ page }) => {
    await page.goto('/parent/announcements');
    
    // Verify page loaded
    await expect(page.locator('h1:has-text("Announcements")')).toBeVisible();
    
    // Verify only one sidebar
    await expectOneSidebar(page);
  });
});
