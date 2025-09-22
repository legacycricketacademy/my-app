import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('login as parent with mock auth and redirect to dashboard', async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Navigate to auth page
    await page.goto('http://localhost:3000/auth');
    
    // Wait for the page to load
    await expect(page.locator('h1:has-text("Legacy Cricket Academy")')).toBeVisible();
    
    // Check that we're using mock authentication
    await expect(page.locator('text=Using Mock authentication')).toBeVisible();
    
    // Fill in credentials
    await page.fill('input[name="email"]', 'parent@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Verify we're on the dashboard
    await expect(page.locator('h1.heading:has-text("Dashboard")')).toBeVisible();
    
    // Verify role badge shows "Parent"
    await expect(page.getByTestId('role-badge')).toHaveText('Parent');
    
    // Verify that parent does NOT see admin stats
    await expect(page.locator('text=Admin Overview')).not.toBeVisible();
    
    // Verify that parent sees regular dashboard stats
    await expect(page.locator('text=Registered Players')).toBeVisible();
  });

  test('login as admin with mock auth and redirect to dashboard', async ({ page }) => {
    // Navigate to auth page
    await page.goto('http://localhost:3000/auth');
    
    // Fill in admin credentials
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Verify we're on the dashboard
    await expect(page.locator('h1.heading:has-text("Dashboard")')).toBeVisible();
    
    // Verify role badge shows "Admin"
    await expect(page.getByTestId('role-badge')).toHaveText('Admin');
    
    // Verify that admin sees admin stats
    await expect(page.locator('text=Admin Overview')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    
    // Verify that admin does NOT see parent stats
    await expect(page.locator('text=Registered Players')).not.toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    // Navigate to auth page
    await page.goto('http://localhost:3000/auth');
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Verify error message is shown
    await expect(page.locator('text=Sign in failed').first()).toBeVisible();
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Verify we're still on auth page
    await expect(page).toHaveURL('http://localhost:3000/auth');
  });

  test('redirect to dashboard if already authenticated', async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // First login
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[name="email"]', 'parent@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Navigate back to auth page
    await page.goto('http://localhost:3000/auth');
    
    // Should be redirected back to dashboard
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('h1.heading:has-text("Dashboard")')).toBeVisible();
  });
});
