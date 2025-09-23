import { test, expect } from '@playwright/test';

test.describe('Cricket Academy - Comprehensive Test Suite', () => {
  test('Complete Application Flow - Admin and Parent Workflows', async ({ page, context }) => {
    // This test covers the complete flow from admin setup to parent usage
    
    // Step 1: Admin Login and Dashboard Setup
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verify admin dashboard loads
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('Admin');

    // Step 2: Admin creates a session
    await page.goto('/admin/sessions');
    await page.click('[data-testid="create-session-button"]');
    
    await page.fill('[data-testid="session-title"]', 'Comprehensive Test Session');
    await page.selectOption('[data-testid="session-type"]', 'practice');
    await page.fill('[data-testid="session-start"]', '2024-12-25T16:00');
    await page.fill('[data-testid="session-end"]', '2024-12-25T18:00');
    await page.fill('[data-testid="session-location"]', 'Field 1');
    await page.fill('[data-testid="session-notes"]', 'Test session for comprehensive testing');
    
    await page.click('[data-testid="submit-session"]');
    await expect(page.locator('text=Session created successfully')).toBeVisible();

    // Step 3: Admin sends payment reminders
    await page.goto('/admin/payments');
    await page.click('[data-testid="send-all-reminders"]');
    await expect(page.locator('text=All reminders sent successfully')).toBeVisible();

    // Step 4: Admin checks email status
    await page.goto('/dashboard');
    await expect(page.locator('text=Email Service Disabled')).toBeVisible();

    // Step 5: Switch to parent view
    await page.click('[data-testid="user-dropdown"]');
    await page.click('text=Sign out');
    await page.waitForURL('/auth');

    // Step 6: Parent login and dashboard
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verify parent dashboard loads
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('Parent');

    // Step 7: Parent views notifications
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Payment Reminder')).toBeVisible();

    // Step 8: Parent views schedule and RSVPs
    await page.goto('/schedule');
    await expect(page.locator('text=Comprehensive Test Session')).toBeVisible();
    
    const rsvpGoing = page.locator('[data-testid="rsvp-going"]').first();
    if (await rsvpGoing.isVisible()) {
      await rsvpGoing.click();
      await expect(page.locator('text=RSVP updated')).toBeVisible();
    }

    // Step 9: Parent sends payment reminder
    await page.goto('/dashboard');
    await page.click('[data-testid="send-reminder"]');
    await expect(page.locator('text=Reminder sent successfully')).toBeVisible();

    // Step 10: Parent navigates through all pages
    const parentPages = ['/players', '/schedule', '/payments', '/announcements'];
    for (const pageUrl of parentPages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(pageUrl);
    }

    // Step 11: Parent signs out
    await page.click('[data-testid="user-dropdown"]');
    await page.click('text=Sign out');
    await page.waitForURL('/auth');
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    // Test error handling across the application
    
    // Test invalid login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Test network error handling
    await page.route('**/api/dashboard/stats', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    // Login as admin
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Dashboard should still load despite API error
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('Mobile Responsiveness - Complete Flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test mobile admin dashboard
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('text=Legacy Cricket Academy')).toBeVisible();

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]');
    await page.click('text=Schedule');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/schedule');

    // Switch to parent view
    await page.click('[data-testid="user-dropdown"]');
    await page.click('text=Sign out');
    await page.waitForURL('/auth');

    // Login as parent
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test mobile parent dashboard
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Performance and Load Testing', async ({ page }) => {
    // Test application performance under load
    
    const startTime = Date.now();
    
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const loginTime = Date.now() - startTime;
    expect(loginTime).toBeLessThan(5000); // Should login within 5 seconds

    // Test dashboard load time
    const dashboardStartTime = Date.now();
    await page.waitForLoadState('networkidle');
    const dashboardLoadTime = Date.now() - dashboardStartTime;
    expect(dashboardLoadTime).toBeLessThan(3000); // Should load within 3 seconds

    // Test navigation performance
    const navStartTime = Date.now();
    await page.goto('/admin/sessions');
    await page.waitForLoadState('networkidle');
    const navTime = Date.now() - navStartTime;
    expect(navTime).toBeLessThan(2000); // Should navigate within 2 seconds
  });

  test('Accessibility Testing', async ({ page }) => {
    // Test basic accessibility features
    
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Test form accessibility
    await page.goto('/admin/sessions');
    await page.click('[data-testid="create-session-button"]');
    
    // Check form labels
    await expect(page.locator('label[for="session-title"]')).toBeVisible();
    await expect(page.locator('label[for="session-type"]')).toBeVisible();
    await expect(page.locator('label[for="session-start"]')).toBeVisible();
    await expect(page.locator('label[for="session-end"]')).toBeVisible();
    await expect(page.locator('label[for="session-location"]')).toBeVisible();
  });

  test('Data Persistence and State Management', async ({ page }) => {
    // Test that data persists across page refreshes
    
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Create a session
    await page.goto('/admin/sessions');
    await page.click('[data-testid="create-session-button"]');
    
    await page.fill('[data-testid="session-title"]', 'Persistence Test Session');
    await page.selectOption('[data-testid="session-type"]', 'practice');
    await page.fill('[data-testid="session-start"]', '2024-12-26T10:00');
    await page.fill('[data-testid="session-end"]', '2024-12-26T12:00');
    await page.fill('[data-testid="session-location"]', 'Field 2');
    
    await page.click('[data-testid="submit-session"]');
    await expect(page.locator('text=Session created successfully')).toBeVisible();

    // Refresh page and check data persists
    await page.reload();
    await expect(page.locator('text=Persistence Test Session')).toBeVisible();

    // Switch to parent and check data is available
    await page.click('[data-testid="user-dropdown"]');
    await page.click('text=Sign out');
    await page.waitForURL('/auth');

    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/schedule');
    await expect(page.locator('text=Persistence Test Session')).toBeVisible();
  });
});
