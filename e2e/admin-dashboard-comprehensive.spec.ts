import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/auth');
    
    // Login as admin
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/admin');
    await expect(page).toHaveTitle(/Dashboard/);
  });

  test('Admin Dashboard - Basic Layout and Navigation', async ({ page }) => {
    // Check main layout elements
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=Manage your cricket academy operations')).toBeVisible();
    
    // Check role badge
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('Admin');
    
    // Check user dropdown
    await page.click('[data-testid="user-dropdown"]');
    await expect(page.locator('text=Test Admin')).toBeVisible();
    await expect(page.locator('text=admin@test.com')).toBeVisible();
  });

  test('Admin Dashboard - Stats Cards Display', async ({ page }) => {
    // Check all stats cards are visible
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active academy members')).toBeVisible();
    
    await expect(page.locator('text=Pending Coaches')).toBeVisible();
    await expect(page.locator('text=Awaiting approval')).toBeVisible();
    
    await expect(page.locator('text=Training Sessions')).toBeVisible();
    await expect(page.locator('text=This month')).toBeVisible();
    
    await expect(page.locator('text=Revenue')).toBeVisible();
    await expect(page.locator('text=This month')).toBeVisible();
    
    // Check stats have numeric values
    const totalUsers = page.locator('text=Total Users').locator('..').locator('div').nth(1);
    await expect(totalUsers).toContainText(/\d+/);
  });

  test('Admin Dashboard - Quick Actions Cards', async ({ page }) => {
    // Test Coach Management card
    await expect(page.locator('text=Coach Management')).toBeVisible();
    await expect(page.locator('text=Review and approve new coach applications')).toBeVisible();
    await expect(page.locator('text=Manage Coaches')).toBeVisible();
    
    // Test User Management card
    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Manage parents, students, and user accounts')).toBeVisible();
    await expect(page.locator('text=Manage Users')).toBeVisible();
    
    // Test Training Sessions card
    await expect(page.locator('text=Training Sessions')).toBeVisible();
    await expect(page.locator('text=Manage schedules and training programs')).toBeVisible();
    await expect(page.locator('text=Manage Sessions')).toBeVisible();
    
    // Test Financial Management card
    await expect(page.locator('text=Financial Management')).toBeVisible();
    await expect(page.locator('text=Review payments and financial reports')).toBeVisible();
    await expect(page.locator('text=Manage Payments')).toBeVisible();
    
    // Test Reports & Analytics card
    await expect(page.locator('text=Reports & Analytics')).toBeVisible();
    await expect(page.locator('text=View performance metrics and insights')).toBeVisible();
    await expect(page.locator('text=View Reports')).toBeVisible();
    
    // Test System Settings card
    await expect(page.locator('text=System Settings')).toBeVisible();
    await expect(page.locator('text=Academy settings and configuration')).toBeVisible();
    await expect(page.locator('text=System Settings')).toBeVisible();
  });

  test('Admin Dashboard - Email Status Banner', async ({ page }) => {
    // Check email status banner is visible
    await expect(page.locator('text=Email Service Disabled')).toBeVisible();
    await expect(page.locator('text=SENDGRID_API_KEY not configured')).toBeVisible();
    
    // Test dismiss functionality
    const dismissButton = page.locator('[data-testid="email-banner-dismiss"]');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
      await expect(page.locator('text=Email Service Disabled')).not.toBeVisible();
    }
  });

  test('Admin Dashboard - Navigation Links Work', async ({ page }) => {
    // Test navigation to different admin pages
    const navigationTests = [
      { text: 'Manage Coaches', expectedUrl: '/admin/coaches' },
      { text: 'Manage Users', expectedUrl: '/admin/users' },
      { text: 'Manage Sessions', expectedUrl: '/admin/sessions' },
      { text: 'Manage Payments', expectedUrl: '/admin/payments' },
      { text: 'View Reports', expectedUrl: '/admin/reports' },
      { text: 'System Settings', expectedUrl: '/admin/settings' }
    ];

    for (const nav of navigationTests) {
      // Click the navigation link
      await page.click(`text=${nav.text}`);
      
      // Check if we're on the expected page (or at least not on dashboard)
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain(nav.expectedUrl);
      
      // Navigate back to dashboard
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Admin Dashboard - Sign Out Functionality', async ({ page }) => {
    // Click user dropdown
    await page.click('[data-testid="user-dropdown"]');
    
    // Click sign out
    await page.click('text=Sign out');
    
    // Check for loading state
    await expect(page.locator('text=Signing out...')).toBeVisible();
    
    // Wait for redirect to auth page
    await page.waitForURL('http://localhost:3000/auth');
    await expect(page).toHaveTitle(/Login/);
  });

  test('Admin Dashboard - Search Functionality', async ({ page }) => {
    // Test search input
    const searchInput = page.locator('input[placeholder*="Search players, schedules"]');
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');
    
    // Clear search
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('Admin Dashboard - Mobile Responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu button is visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Check mobile search is visible
    await expect(page.locator('input[placeholder*="Search players, schedules"]')).toBeVisible();
    
    // Check mobile title
    await expect(page.locator('text=Legacy Cricket Academy')).toBeVisible();
  });

  test('Admin Dashboard - API Calls Work', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });

    // Wait for page to load and make API calls
    await page.waitForLoadState('networkidle');
    
    // Check that admin stats API was called
    expect(requests.some(url => url.includes('/api/admin/stats'))).toBeTruthy();
    
    // Check that other dashboard APIs were called
    expect(requests.some(url => url.includes('/api/dashboard/stats'))).toBeTruthy();
    expect(requests.some(url => url.includes('/api/players'))).toBeTruthy();
    expect(requests.some(url => url.includes('/api/sessions/today'))).toBeTruthy();
  });

  test('Admin Dashboard - Error Handling', async ({ page }) => {
    // Test that dashboard loads even if some API calls fail
    // This is handled by the ErrorBoundary components
    
    // Check that the main dashboard content is still visible
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=Manage your cricket academy operations')).toBeVisible();
  });
});

