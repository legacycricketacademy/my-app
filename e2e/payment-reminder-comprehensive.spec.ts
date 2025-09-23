import { test, expect } from '@playwright/test';

test.describe('Payment Reminder System - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for payment management
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Admin Payment Management - Individual Reminders', async ({ page }) => {
    // Navigate to payments page
    await page.goto('/admin/payments');
    await expect(page.locator('h1')).toContainText('Payments');

    // Check payment list is visible
    await expect(page.locator('text=Payment Status')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=$175.00')).toBeVisible();

    // Test individual payment reminder
    const sendReminderButton = page.locator('[data-testid="send-reminder"]').first();
    await expect(sendReminderButton).toBeVisible();
    
    await sendReminderButton.click();
    
    // Check loading state
    await expect(page.locator('text=Sending...')).toBeVisible();
    
    // Check success message
    await expect(page.locator('text=Reminder sent successfully')).toBeVisible();
  });

  test('Admin Payment Management - Bulk Reminders', async ({ page }) => {
    // Navigate to payments page
    await page.goto('/admin/payments');

    // Test send all reminders button
    const sendAllButton = page.locator('[data-testid="send-all-reminders"]');
    await expect(sendAllButton).toBeVisible();
    
    await sendAllButton.click();
    
    // Check loading state
    await expect(page.locator('text=Sending...')).toBeVisible();
    
    // Check success message
    await expect(page.locator('text=All reminders sent successfully')).toBeVisible();
  });

  test('Parent Dashboard - Payment Reminders', async ({ page }) => {
    // Switch to parent view
    await page.click('[data-testid="user-dropdown"]');
    await page.click('text=Sign out');
    await page.waitForURL('/auth');

    // Login as parent
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Check payment card on dashboard
    await expect(page.locator('text=Payment Status')).toBeVisible();
    await expect(page.locator('text=Send Reminder')).toBeVisible();
    await expect(page.locator('text=Send All Reminders')).toBeVisible();

    // Test individual reminder from parent dashboard
    const sendReminderButton = page.locator('[data-testid="send-reminder"]').first();
    await sendReminderButton.click();
    await expect(page.locator('text=Reminder sent successfully')).toBeVisible();

    // Test send all reminders from parent dashboard
    const sendAllButton = page.locator('[data-testid="send-all-reminders"]');
    await sendAllButton.click();
    await expect(page.locator('text=All reminders sent successfully')).toBeVisible();
  });

  test('Parent Notifications - Payment Reminders', async ({ page }) => {
    // Login as parent
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Check notifications card
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Payment Reminder')).toBeVisible();
    await expect(page.locator('text=Payment of $175 for John Doe is due in 7 days')).toBeVisible();

    // Test mark as read functionality
    const markAsReadButton = page.locator('[data-testid="mark-as-read"]').first();
    if (await markAsReadButton.isVisible()) {
      await markAsReadButton.click();
      await expect(page.locator('text=Marked as read')).toBeVisible();
    }

    // Test notification click navigation
    const notificationLink = page.locator('[data-testid="notification-link"]').first();
    if (await notificationLink.isVisible()) {
      await notificationLink.click();
      await page.waitForURL('/payments');
      await expect(page.locator('h1')).toContainText('Payments');
    }
  });

  test('Email Service Status - Admin View', async ({ page }) => {
    // Check email status banner on admin dashboard
    await expect(page.locator('text=Email Service Disabled')).toBeVisible();
    await expect(page.locator('text=SENDGRID_API_KEY not configured')).toBeVisible();

    // Test dismiss functionality
    const dismissButton = page.locator('[data-testid="email-banner-dismiss"]');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
      await expect(page.locator('text=Email Service Disabled')).not.toBeVisible();
    }
  });

  test('Email Service Status - API Endpoints', async ({ page }) => {
    // Test email status API
    const response = await page.request.get('/api/email/status');
    expect(response.status()).toBe(200);
    
    const emailStatus = await response.json();
    expect(emailStatus).toHaveProperty('enabled');
    expect(emailStatus).toHaveProperty('fromEmail');
    expect(emailStatus).toHaveProperty('replyToEmail');

    // Test dev test email endpoint (should be available in development)
    const testEmailResponse = await page.request.post('/api/dev/test-email', {
      data: { to: 'test@example.com' }
    });
    
    if (testEmailResponse.status() === 200) {
      const testResult = await testEmailResponse.json();
      expect(testResult).toHaveProperty('sent');
      expect(testResult).toHaveProperty('reason');
    }
  });

  test('Payment Reminder - Error Handling', async ({ page }) => {
    // Test payment reminder with network issues
    await page.goto('/admin/payments');

    // Mock network failure
    await page.route('**/api/payments/send-all-reminders', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network error' })
      });
    });

    const sendAllButton = page.locator('[data-testid="send-all-reminders"]');
    await sendAllButton.click();

    // Check error message
    await expect(page.locator('text=Failed to send reminders')).toBeVisible();
  });

  test('Payment Reminder - Loading States', async ({ page }) => {
    await page.goto('/admin/payments');

    // Test individual reminder loading state
    const sendReminderButton = page.locator('[data-testid="send-reminder"]').first();
    await sendReminderButton.click();
    
    // Check button is disabled during loading
    await expect(sendReminderButton).toBeDisabled();
    await expect(page.locator('text=Sending...')).toBeVisible();

    // Wait for completion
    await expect(page.locator('text=Reminder sent successfully')).toBeVisible();
    await expect(sendReminderButton).not.toBeDisabled();

    // Test bulk reminder loading state
    const sendAllButton = page.locator('[data-testid="send-all-reminders"]');
    await sendAllButton.click();
    
    await expect(sendAllButton).toBeDisabled();
    await expect(page.locator('text=Sending...')).toBeVisible();

    await expect(page.locator('text=All reminders sent successfully')).toBeVisible();
    await expect(sendAllButton).not.toBeDisabled();
  });

  test('Payment Reminder - Data Validation', async ({ page }) => {
    await page.goto('/admin/payments');

    // Check payment data is properly displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=$175.00')).toBeVisible();
    await expect(page.locator('text=September 29, 2025')).toBeVisible();
    await expect(page.locator('text=Monthly Training Fee')).toBeVisible();

    // Check payment status
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('Payment Reminder - Mobile Responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/payments');

    // Check mobile layout
    await expect(page.locator('text=Payment Status')).toBeVisible();
    await expect(page.locator('[data-testid="send-reminder"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-all-reminders"]')).toBeVisible();

    // Test mobile payment reminder
    const sendReminderButton = page.locator('[data-testid="send-reminder"]').first();
    await sendReminderButton.click();
    await expect(page.locator('text=Reminder sent successfully')).toBeVisible();
  });

  test('Payment Reminder - API Integration', async ({ page }) => {
    // Monitor API calls
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });

    await page.goto('/admin/payments');
    await page.waitForLoadState('networkidle');

    // Check that payment APIs were called
    expect(requests.some(url => url.includes('/api/payments'))).toBeTruthy();

    // Test sending reminder
    const sendReminderButton = page.locator('[data-testid="send-reminder"]').first();
    await sendReminderButton.click();

    // Check that reminder API was called
    expect(requests.some(url => url.includes('/api/payments/send-all-reminders'))).toBeTruthy();
  });
});

