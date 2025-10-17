import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Sessions E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE}/auth`);
    await page.getByPlaceholder('Enter your email').fill(process.env.ADMIN_EMAIL || 'admin@test.com');
    await page.getByPlaceholder('Enter your password').fill(process.env.ADMIN_PASSWORD || 'Test1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should create a new session and display it in the schedule', async ({ page }) => {
    // Navigate to schedule page
    await page.goto(`${BASE}/dashboard/schedule`);
    await expect(page.getByText('Schedule')).toBeVisible();

    // Click Add Session button
    await page.getByRole('button', { name: /add session/i }).click();
    
    // Wait for modal to open
    await expect(page.getByText('Schedule New Session')).toBeVisible();

    // Fill in session details
    await page.getByPlaceholder('e.g., Batting Practice').fill('Test Batting Session');
    
    // Select age group
    await page.getByRole('combobox').first().click();
    await page.getByText('Under 12s').click();
    
    // Fill location
    await page.getByPlaceholder('e.g., Main Ground').fill('Test Ground');
    
    // Set start time (today at 4 PM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Click start date picker
    await page.getByRole('button', { name: /pick date/i }).first().click();
    // Select tomorrow's date
    await page.getByRole('gridcell', { name: tomorrow.getDate().toString() }).click();
    
    // Set start time
    await page.getByDisplayValue('16:00').fill('16:00');
    
    // Set end time (2 hours later)
    await page.getByDisplayValue('18:00').fill('18:00');
    
    // Set max attendees
    await page.getByRole('spinbutton').fill('25');
    
    // Add notes
    await page.getByPlaceholder('Additional information about the session...').fill('Bring your own gear');
    
    // Submit the form
    await page.getByRole('button', { name: /schedule session/i }).click();
    
    // Wait for success toast
    await expect(page.getByText('Session scheduled successfully')).toBeVisible();
    
    // Wait for modal to close
    await expect(page.getByText('Schedule New Session')).not.toBeVisible();
    
    // Verify session appears in the list
    await expect(page.getByText('Test Batting Session')).toBeVisible();
    await expect(page.getByText('Under 12s')).toBeVisible();
    await expect(page.getByText('Test Ground')).toBeVisible();
    await expect(page.getByText('Bring your own gear')).toBeVisible();
  });

  test('should show empty state when no sessions exist', async ({ page }) => {
    // Navigate to schedule page
    await page.goto(`${BASE}/dashboard/schedule`);
    
    // Should see empty state
    await expect(page.getByText('No sessions scheduled')).toBeVisible();
    await expect(page.getByText('Create your first training session or match to get started.')).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    // Navigate to schedule page
    await page.goto(`${BASE}/dashboard/schedule`);
    
    // Click Add Session button
    await page.getByRole('button', { name: /add session/i }).click();
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /schedule session/i }).click();
    
    // Should see validation errors
    await expect(page.getByText('Title must be at least 3 characters')).toBeVisible();
    await expect(page.getByText('Location is required')).toBeVisible();
  });
});
