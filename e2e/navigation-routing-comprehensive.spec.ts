import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing - Comprehensive Tests', () => {
  test('Admin Navigation - All Links Work', async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test admin dashboard navigation
    const adminNavTests = [
      { text: 'Manage Coaches', expectedUrl: '/admin/coaches', expectedTitle: 'Coaches' },
      { text: 'Manage Users', expectedUrl: '/admin/users', expectedTitle: 'Users' },
      { text: 'Manage Sessions', expectedUrl: '/admin/sessions', expectedTitle: 'Sessions' },
      { text: 'Manage Payments', expectedUrl: '/admin/payments', expectedTitle: 'Payments' },
      { text: 'View Reports', expectedUrl: '/admin/reports', expectedTitle: 'Reports' },
      { text: 'System Settings', expectedUrl: '/admin/settings', expectedTitle: 'Settings' }
    ];

    for (const nav of adminNavTests) {
      // Click navigation link
      await page.click(`text=${nav.text}`);
      
      // Wait for navigation
      await page.waitForTimeout(1000);
      
      // Check URL contains expected path
      expect(page.url()).toContain(nav.expectedUrl);
      
      // Check page title or heading
      if (nav.expectedTitle) {
        await expect(page.locator('h1')).toContainText(nav.expectedTitle);
      }
      
      // Navigate back to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Parent Navigation - All Links Work', async ({ page }) => {
    // Login as parent
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test parent navigation
    const parentNavTests = [
      { text: 'View All', expectedUrl: '/players', expectedTitle: 'Players' },
      { text: 'Schedule', expectedUrl: '/schedule', expectedTitle: 'Schedule' },
      { text: 'Payments', expectedUrl: '/payments', expectedTitle: 'Payments' },
      { text: 'Announcements', expectedUrl: '/announcements', expectedTitle: 'Announcements' }
    ];

    for (const nav of parentNavTests) {
      // Click navigation link
      await page.click(`text=${nav.text}`);
      
      // Wait for navigation
      await page.waitForTimeout(1000);
      
      // Check URL contains expected path
      expect(page.url()).toContain(nav.expectedUrl);
      
      // Check page title or heading
      if (nav.expectedTitle) {
        await expect(page.locator('h1')).toContainText(nav.expectedTitle);
      }
      
      // Navigate back to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Sidebar Navigation - Admin', async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test sidebar navigation
    const sidebarTests = [
      { text: 'Dashboard', expectedUrl: '/dashboard' },
      { text: 'Players', expectedUrl: '/players' },
      { text: 'Schedule', expectedUrl: '/schedule' },
      { text: 'Payments', expectedUrl: '/payments' },
      { text: 'Announcements', expectedUrl: '/announcements' },
      { text: 'Settings', expectedUrl: '/settings' }
    ];

    for (const nav of sidebarTests) {
      // Click sidebar link
      await page.click(`[data-testid="sidebar-${nav.text.toLowerCase()}"]`);
      
      // Wait for navigation
      await page.waitForTimeout(1000);
      
      // Check URL
      expect(page.url()).toContain(nav.expectedUrl);
    }
  });

  test('Sidebar Navigation - Parent', async ({ page }) => {
    // Login as parent
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test parent sidebar navigation
    const parentSidebarTests = [
      { text: 'Dashboard', expectedUrl: '/dashboard' },
      { text: 'Players', expectedUrl: '/players' },
      { text: 'Schedule', expectedUrl: '/schedule' },
      { text: 'Payments', expectedUrl: '/payments' },
      { text: 'Announcements', expectedUrl: '/announcements' }
    ];

    for (const nav of parentSidebarTests) {
      // Click sidebar link
      await page.click(`[data-testid="sidebar-${nav.text.toLowerCase()}"]`);
      
      // Wait for navigation
      await page.waitForTimeout(1000);
      
      // Check URL
      expect(page.url()).toContain(nav.expectedUrl);
    }
  });

  test('Mobile Navigation - Admin', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Open mobile menu
    await mobileMenuButton.click();
    
    // Check mobile menu items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Players')).toBeVisible();
    await expect(page.locator('text=Schedule')).toBeVisible();
    await expect(page.locator('text=Payments')).toBeVisible();
    await expect(page.locator('text=Announcements')).toBeVisible();

    // Test mobile navigation
    await page.click('text=Schedule');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/schedule');
  });

  test('Mobile Navigation - Parent', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login as parent
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Open mobile menu
    await mobileMenuButton.click();
    
    // Check mobile menu items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Players')).toBeVisible();
    await expect(page.locator('text=Schedule')).toBeVisible();
    await expect(page.locator('text=Payments')).toBeVisible();
    await expect(page.locator('text=Announcements')).toBeVisible();

    // Test mobile navigation
    await page.click('text=Players');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/players');
  });

  test('Breadcrumb Navigation', async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to a sub-page
    await page.goto('/admin/sessions');
    
    // Check breadcrumb navigation
    const breadcrumb = page.locator('[data-testid="breadcrumb"]');
    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toContainText('Admin');
      await expect(breadcrumb).toContainText('Sessions');
      
      // Test breadcrumb navigation
      await page.click('[data-testid="breadcrumb-admin"]');
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/admin');
    }
  });

  test('Back Button Navigation', async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to a page
    await page.goto('/admin/sessions');
    
    // Use browser back button
    await page.goBack();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/dashboard');
    
    // Use browser forward button
    await page.goForward();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/admin/sessions');
  });

  test('Direct URL Access - Admin Pages', async ({ page }) => {
    // Test direct access to admin pages without login
    const adminPages = [
      '/admin/sessions',
      '/admin/coaches',
      '/admin/users',
      '/admin/payments',
      '/admin/reports',
      '/admin/settings'
    ];

    for (const pageUrl of adminPages) {
      await page.goto(pageUrl);
      
      // Should redirect to login
      await page.waitForURL('/auth');
      await expect(page.locator('h1')).toContainText('Login');
    }
  });

  test('Direct URL Access - Parent Pages', async ({ page }) => {
    // Test direct access to parent pages without login
    const parentPages = [
      '/players',
      '/schedule',
      '/payments',
      '/announcements'
    ];

    for (const pageUrl of parentPages) {
      await page.goto(pageUrl);
      
      // Should redirect to login
      await page.waitForURL('/auth');
      await expect(page.locator('h1')).toContainText('Login');
    }
  });

  test('Role-Based Access Control', async ({ page }) => {
    // Login as parent
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Try to access admin pages
    const adminPages = [
      '/admin/sessions',
      '/admin/coaches',
      '/admin/users',
      '/admin/payments',
      '/admin/reports',
      '/admin/settings'
    ];

    for (const pageUrl of adminPages) {
      await page.goto(pageUrl);
      
      // Should show 403 or redirect
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).not.toContain(pageUrl);
    }
  });

  test('Search Functionality', async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');
    
    // Press Enter
    await searchInput.press('Enter');
    
    // Check if search results are displayed
    await page.waitForTimeout(1000);
    // This would depend on your search implementation
  });

  test('User Dropdown Navigation', async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test user dropdown
    const userDropdown = page.locator('[data-testid="user-dropdown"]');
    await userDropdown.click();
    
    // Check dropdown items
    await expect(page.locator('text=Test Admin')).toBeVisible();
    await expect(page.locator('text=admin@test.com')).toBeVisible();
    await expect(page.locator('text=Sign out')).toBeVisible();
    
    // Test profile link (if exists)
    const profileLink = page.locator('text=Profile');
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/profile');
    }
  });

  test('404 Error Handling', async ({ page }) => {
    // Test non-existent page
    await page.goto('/non-existent-page');
    
    // Should show 404 page
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Page Not Found')).toBeVisible();
    
    // Test back to home link
    const homeLink = page.locator('text=Back to Home');
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForURL('/');
    }
  });
});

