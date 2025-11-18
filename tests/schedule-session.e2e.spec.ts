import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Schedule Session E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Use authenticated session
    await page.goto(`${BASE_URL}/dashboard/schedule`);
    await expect(page.getByRole('heading', { name: 'Schedule', exact: true })).toBeVisible();
  });

  test('should open schedule session dialog and fill form', async ({ page }) => {
    // Click the "Add Session" button (there are two, click the first one)
    await page.getByRole('button', { name: /add session/i }).first().click();
    
    // Wait for dialog to open
    await expect(page.getByRole('heading', { name: 'Schedule New Training Session', exact: true })).toBeVisible();
    
    // Fill session title
    await page.getByLabel('Session Title').fill('Test Training Session');
    
    // Fill start date & time
    await page.getByRole('button', { name: /start date & time/i }).click();
    await expect(page.getByText('Select Time:')).toBeVisible();
    
    // Select time (12:30)
    await page.locator('select').first().selectOption('12');
    await page.locator('select').nth(1).selectOption('30');
    
    // Click OK to confirm time
    await page.getByRole('button', { name: 'OK' }).click();
    
    // Fill end date & time
    await page.getByRole('button', { name: /end date & time/i }).click();
    await expect(page.getByText('Select Time:')).toBeVisible();
    
    // Select end time (13:30)
    await page.locator('select').first().selectOption('13');
    await page.locator('select').nth(1).selectOption('30');
    
    // Click OK to confirm end time
    await page.getByRole('button', { name: 'OK' }).click();
    
    // Fill location
    await page.getByRole('combobox', { name: /location/i }).click();
    await page.getByRole('option', { name: 'Strongsville' }).click();
    
    // Fill age group
    await page.getByRole('combobox', { name: /age group/i }).click();
    await page.getByRole('option', { name: '8+ years' }).click();
    
    // Fill session type
    await page.getByRole('combobox', { name: /session type/i }).click();
    await page.getByRole('option', { name: 'Training' }).click();
    
    // Fill max attendees
    await page.getByLabel('Maximum Attendees').fill('15');
    
    // Fill description
    await page.getByLabel('Description').fill('Test session for E2E testing');
    
    // Submit the form
    await page.getByRole('button', { name: 'Schedule Session' }).click();
    
    // Wait for success toast
    await expect(page.getByText('Session created successfully')).toBeVisible();
    
    // Dialog should close
    await expect(page.getByRole('heading', { name: 'Schedule New Training Session', exact: true })).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click the "Add Session" button (there are two, click the first one)
    await page.getByRole('button', { name: /add session/i }).first().click();
    
    // Wait for dialog to open
    await expect(page.getByRole('heading', { name: 'Schedule New Training Session', exact: true })).toBeVisible();
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Schedule Session' }).click();
    
    // Should show validation errors
    await expect(page.getByText('Title must be at least 3 characters')).toBeVisible();
    await expect(page.getByText('Please select a start date & time')).toBeVisible();
    await expect(page.getByText('Please select an end date & time')).toBeVisible();
    await expect(page.getByText('Location is required')).toBeVisible();
    await expect(page.getByText('Age group is required')).toBeVisible();
    await expect(page.getByText('Session type is required')).toBeVisible();
  });

  test('should cancel dialog without saving', async ({ page }) => {
    // Click the "Schedule New Session" button
    await page.getByRole('button', { name: /schedule new session/i }).click();
    
    // Wait for dialog to open
    await expect(page.getByRole('heading', { name: 'Schedule New Training Session', exact: true })).toBeVisible();
    
    // Fill some data
    await page.getByLabel('Session Title').fill('Test Session');
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Dialog should close
    await expect(page.getByRole('heading', { name: 'Schedule New Training Session', exact: true })).not.toBeVisible();
  });

  test('should handle time selection properly', async ({ page }) => {
    // Click the "Schedule New Session" button
    await page.getByRole('button', { name: /schedule new session/i }).click();
    
    // Wait for dialog to open
    await expect(page.getByRole('heading', { name: 'Schedule New Training Session', exact: true })).toBeVisible();
    
    // Open start time picker
    await page.getByRole('button', { name: /start date & time/i }).click();
    
    // Verify time selection UI is visible
    await expect(page.getByText('Select Time:')).toBeVisible();
    
    // Select a specific time
    await page.locator('select').first().selectOption('14');
    await page.locator('select').nth(1).selectOption('45');
    
    // Verify current time display updates
    await expect(page.getByText('Current: 2:45 PM')).toBeVisible();
    
    // Click OK
    await page.getByRole('button', { name: 'OK' }).click();
    
    // Verify the button shows the selected time
    await expect(page.getByRole('button', { name: /14:45/ })).toBeVisible();
  });
});
