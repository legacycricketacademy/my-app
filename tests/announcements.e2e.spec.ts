import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Announcements E2E', () => {
  // Use the authenticated session from setup
  test.beforeEach(async ({ page }) => {
    // Navigate directly to announcements (auth is already set from setup project)
    await page.goto(`${BASE}/dashboard/announcements`);
    
    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Announcements', exact: true })).toBeVisible();
  });

  test('should create an announcement and display it in the list', async ({ page }) => {
    // Click Create Announcement button (page already loaded from beforeEach)
    await page.getByRole('button', { name: /create announcement/i }).first().click();
    
    // Wait for modal to appear (check for heading since there's no role="dialog")
    await expect(page.getByRole('heading', { name: 'Create Announcement', exact: true })).toBeVisible();

    // Fill in title (no placeholder, just required input)
    await page.getByLabel('Title').fill('Training Session Cancelled');
    
    // Fill in message
    await page.getByLabel('Message').fill('Due to weather conditions, today\'s training session has been cancelled. We will reschedule for tomorrow at the same time.');
    
    // Select audience (using select dropdown)
    await page.getByLabel('Audience').selectOption('players');
    
    // Select priority
    await page.getByLabel('Priority').selectOption('high');
    
    // Submit the form (button text is "Create")
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    
    // Wait for modal to close (check that heading is no longer visible)
    await expect(page.getByRole('heading', { name: 'Create Announcement', exact: true })).not.toBeVisible();
    
    // Verify announcement appears in the list
    await expect(page.getByText('Training Session Cancelled')).toBeVisible();
  });

  test('should show empty state when no announcements exist', async ({ page }) => {
    // Should see empty state (page already loaded from beforeEach)
    await expect(page.getByText('No announcements yet')).toBeVisible();
    await expect(page.getByText('Create announcements to keep players and parents informed.')).toBeVisible();
  });

  test('should validate announcement form fields', async ({ page }) => {
    // Click Create Announcement button (page already loaded from beforeEach)
    await page.getByRole('button', { name: /create announcement/i }).first().click();
    
    // Wait for modal to appear
    await expect(page.getByRole('heading', { name: 'Create Announcement', exact: true })).toBeVisible();
    
    // Try to submit without filling required fields (HTML5 validation will prevent submission)
    // This test verifies browser validation is working
    const titleInput = page.getByLabel('Title');
    const messageInput = page.getByLabel('Message');
    
    // Verify required attributes
    await expect(titleInput).toHaveAttribute('required', '');
    await expect(messageInput).toHaveAttribute('required', '');
  });

  test('should fill and submit announcement form', async ({ page }) => {
    // Click Create Announcement button (page already loaded from beforeEach)
    await page.getByRole('button', { name: /create announcement/i }).first().click();
    
    // Wait for modal to appear
    await expect(page.getByRole('heading', { name: 'Create Announcement', exact: true })).toBeVisible();
    
    // Fill in the form
    await page.getByLabel('Title').fill('Test Announcement');
    await page.getByLabel('Message').fill('This is a test message');
    await page.getByLabel('Audience').selectOption('all');
    await page.getByLabel('Priority').selectOption('normal');
    
    // Submit (button might be disabled during submission)
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    
    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Create Announcement', exact: true })).not.toBeVisible({ timeout: 15000 });
  });
});
