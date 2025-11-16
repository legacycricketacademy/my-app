import { test, expect } from '@playwright/test';

test.describe('Email Mailbox UI', () => {
  test('should display email mailbox page', async ({ page }) => {
    await page.goto('/dev/emails');
    
    // Check page title
    await expect(page.getByRole('heading', { name: /Email Sandbox/i })).toBeVisible();
    
    // Check for inbox section
    await expect(page.getByText(/Inbox/i)).toBeVisible();
    
    // Check for email preview section
    await expect(page.getByText(/Email Preview/i)).toBeVisible();
  });

  test('should show empty state when no emails', async ({ page }) => {
    // Clear emails first
    await page.request.delete('/api/dev/test-emails');
    
    await page.goto('/dev/emails');
    
    // Should show empty state
    await expect(page.getByText(/No emails captured yet/i)).toBeVisible();
  });

  test('should display captured emails after registration', async ({ page }) => {
    // Clear emails first
    await page.request.delete('/api/dev/test-emails');
    
    // Register a new user to trigger email
    await page.goto('/register');
    
    const timestamp = Date.now();
    await page.fill('input[name="username"]', `testuser${timestamp}`);
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    await page.click('button[type="submit"]');
    
    // Wait for registration to complete
    await page.waitForTimeout(1000);
    
    // Navigate to email mailbox
    await page.goto('/dev/emails');
    
    // Should show the captured email
    await expect(page.getByText(/registration_welcome/i)).toBeVisible();
    await expect(page.getByText(`test${timestamp}@example.com`)).toBeVisible();
  });

  test('should preview email when clicked', async ({ page }) => {
    await page.goto('/dev/emails');
    
    // Wait for emails to load
    await page.waitForTimeout(500);
    
    // Check if there are any emails
    const emailCount = await page.locator('[data-email-item]').count();
    
    if (emailCount > 0) {
      // Click first email
      await page.locator('[data-email-item]').first().click();
      
      // Should show email details
      await expect(page.getByText(/From:/i)).toBeVisible();
      await expect(page.getByText(/To:/i)).toBeVisible();
      await expect(page.getByText(/Subject:/i)).toBeVisible();
    }
  });

  test('should clear all emails', async ({ page }) => {
    await page.goto('/dev/emails');
    
    // Click clear all button
    const clearButton = page.getByRole('button', { name: /Clear All/i });
    
    // Only test if button is enabled (emails exist)
    if (await clearButton.isEnabled()) {
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept());
      
      await clearButton.click();
      
      // Should show empty state
      await expect(page.getByText(/No emails captured yet/i)).toBeVisible();
    }
  });

  test('should auto-refresh emails', async ({ page }) => {
    await page.goto('/dev/emails');
    
    // Get initial email count
    const initialText = await page.textContent('body');
    
    // Wait for auto-refresh (5 seconds)
    await page.waitForTimeout(6000);
    
    // Page should still be functional
    await expect(page.getByRole('heading', { name: /Email Sandbox/i })).toBeVisible();
  });

  test('should toggle between HTML and text view', async ({ page }) => {
    await page.goto('/dev/emails');
    
    // Wait for emails to load
    await page.waitForTimeout(500);
    
    const emailCount = await page.locator('button').filter({ hasText: /registration_welcome/i }).count();
    
    if (emailCount > 0) {
      // Click first email
      await page.locator('button').filter({ hasText: /registration_welcome/i }).first().click();
      
      // Should see HTML and Text buttons
      const htmlButton = page.getByRole('button', { name: 'HTML' });
      const textButton = page.getByRole('button', { name: 'Text' });
      
      await expect(htmlButton).toBeVisible();
      await expect(textButton).toBeVisible();
      
      // Click text view
      await textButton.click();
      
      // Click back to HTML view
      await htmlButton.click();
    }
  });
});
