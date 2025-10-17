import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

// Clear storage state for announcements tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Announcements E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE}/auth`);
    await page.getByPlaceholder('Enter your email').fill(process.env.ADMIN_EMAIL || 'admin@test.com');
    await page.getByPlaceholder('Enter your password').fill(process.env.ADMIN_PASSWORD || 'Test1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  });

  test('should create an announcement and display it in the list', async ({ page }) => {
    // Navigate to announcements page
    await page.goto(`${BASE}/dashboard/announcements`);
    await expect(page.getByText('Announcements')).toBeVisible();

    // Click Create Announcement button
    await page.getByRole('button', { name: /create announcement/i }).click();
    
    // Wait for modal to open
    await expect(page.getByText('Create Announcement')).toBeVisible();

    // Fill in announcement details
    await page.getByPlaceholder('Enter announcement title').fill('Training Session Cancelled');
    
    // Select audience
    await page.getByRole('combobox').first().click();
    await page.getByText('Players').click();
    
    // Select priority
    await page.getByRole('combobox').nth(1).click();
    await page.getByText('High').click();
    
    // Fill in message
    await page.getByPlaceholder('Enter your announcement message...').fill('Due to weather conditions, today\'s training session has been cancelled. We will reschedule for tomorrow at the same time.');
    
    // Submit the form
    await page.getByRole('button', { name: /create announcement/i }).click();
    
    // Wait for success toast
    await expect(page.getByText('Announcement created successfully')).toBeVisible();
    
    // Wait for modal to close
    await expect(page.getByText('Create Announcement')).not.toBeVisible();
    
    // Verify announcement appears in the list
    await expect(page.getByText('Training Session Cancelled')).toBeVisible();
    await expect(page.getByText('Due to weather conditions, today\'s training session has been cancelled. We will reschedule for tomorrow at the same time.')).toBeVisible();
    await expect(page.getByText('High')).toBeVisible();
    await expect(page.getByText('players')).toBeVisible();
  });

  test('should show empty state when no announcements exist', async ({ page }) => {
    // Navigate to announcements page
    await page.goto(`${BASE}/dashboard/announcements`);
    
    // Should see empty state
    await expect(page.getByText('No announcements yet')).toBeVisible();
    await expect(page.getByText('Create announcements to keep players and parents informed.')).toBeVisible();
  });

  test('should validate announcement form fields', async ({ page }) => {
    // Navigate to announcements page
    await page.goto(`${BASE}/dashboard/announcements`);
    
    // Click Create Announcement button
    await page.getByRole('button', { name: /create announcement/i }).click();
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /create announcement/i }).click();
    
    // Should see validation errors
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByText('Body is required')).toBeVisible();
  });

  test('should show character count for announcement body', async ({ page }) => {
    // Navigate to announcements page
    await page.goto(`${BASE}/dashboard/announcements`);
    
    // Click Create Announcement button
    await page.getByRole('button', { name: /create announcement/i }).click();
    
    // Type in the message field
    const messageField = page.getByPlaceholder('Enter your announcement message...');
    await messageField.fill('Test message');
    
    // Should see character count
    await expect(page.getByText('12 / 5000 characters')).toBeVisible();
  });
});
