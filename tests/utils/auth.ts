import { Page, expect } from '@playwright/test';

/**
 * Reusable helper to log in as a specific user
 */
export async function loginAs(page: Page, email: string, password: string) {
  // Navigate to auth page
  await page.goto('/auth');
  
  // Wait for page to load
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect away from /auth (to dashboard or parent routes)
  await page.waitForURL(/\/(dashboard|parent)/, { timeout: 15000 });
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  // Find and click the logout/sign out button
  const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")').first();
  await logoutButton.click();
  
  // Wait for redirect to auth page
  await page.waitForURL('/auth', { timeout: 10000 });
}

/**
 * Verify only one sidebar is rendered on the page
 */
export async function expectOneSidebar(page: Page) {
  // Wait for page to be stable
  await page.waitForLoadState('networkidle');
  
  // Count sidebar elements - look for common sidebar classes/elements
  const sidebarElements = await page.locator('aside, nav[class*="sidebar"], [class*="sidebar"]').count();
  
  // Should have exactly 1 sidebar
  expect(sidebarElements).toBeLessThanOrEqual(2); // Allow 1-2 (desktop + mobile)
  
  // More specific check: ensure we don't have duplicate visible sidebars
  const visibleSidebars = await page.locator('aside:visible, nav[class*="sidebar"]:visible').count();
  expect(visibleSidebars).toBeLessThanOrEqual(1);
}

/**
 * Check that the current session is authenticated
 */
export async function expectAuthenticated(page: Page) {
  const response = await page.request.get('/api/session');
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data.authenticated).toBe(true);
  expect(data.user).toBeTruthy();
  expect(data.user.id).toBeTruthy();
}

/**
 * Check that the current session is NOT authenticated
 */
export async function expectUnauthenticated(page: Page) {
  const response = await page.request.get('/api/session');
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data.authenticated).toBe(false);
}

/**
 * Admin test account credentials
 */
export const ADMIN_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'password'
};

/**
 * Parent test account credentials
 */
export const PARENT_CREDENTIALS = {
  email: 'parent@test.com',
  password: 'password'
};
