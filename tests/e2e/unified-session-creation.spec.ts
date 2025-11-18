import { test, expect } from '@playwright/test';
import { loginAs, ADMIN_CREDENTIALS } from '../utils/auth';

// Clear storage state and login fresh
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Unified Session Creation Flow - Cross-View Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.waitForURL(/\/dashboard/);
    await page.waitForTimeout(1000);
  });

  test('Schedule page loads successfully and creates session with toast', async ({ page }) => {
    // Navigate to /dashboard/schedule
    await page.goto('/dashboard/schedule');
    await page.waitForLoadState('networkidle');
    
    // Wait for and validate GET /api/coach/sessions response
    const getSessionsPromise = page.waitForResponse(
      response => response.url().includes('/api/coach/sessions') && response.request().method() === 'GET'
    );
    
    await page.reload();
    const getResponse = await getSessionsPromise;
    
    // Assert GET returns 200
    expect(getResponse.status()).toBe(200);
    
    // Verify no "Failed to load schedule" error
    await expect(page.getByText('Failed to load schedule')).not.toBeVisible();
    
    // Click "Schedule New Session" button
    const scheduleButton = page.locator('button:has-text("Schedule New Session"), button:has-text("Schedule New")').first();
    await scheduleButton.click();
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill in form
    const timestamp = Date.now();
    const sessionTitle = `Schedule Page Test ${timestamp}`;
    await page.fill('input[placeholder*="Batting Practice"]', sessionTitle);
    
    // Open Start Date & Time picker
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select a date
    await page.locator('button[name="day"]').first().click();
    await page.waitForTimeout(300);
    
    // Set start time to 14:00
    await page.getByTestId('start-time-hours').selectOption('14');
    await page.getByTestId('start-time-minutes').selectOption('0');
    await page.waitForTimeout(300);
    
    // Click Apply (mobile-safe)
    const applyButtonStart = page.locator('button:has-text("Apply")').first();
    await applyButtonStart.scrollIntoViewIfNeeded();
    await applyButtonStart.click({ force: true });
    await page.waitForTimeout(500);
    
    // Open End Date & Time picker
    const endTimeButton = page.locator('button:has-text("Select date & time")').last();
    await endTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select same date
    await page.locator('button[name="day"]').first().click();
    await page.waitForTimeout(300);
    
    // Set end time to 16:00
    await page.getByTestId('end-time-hours').selectOption('16');
    await page.getByTestId('end-time-minutes').selectOption('0');
    await page.waitForTimeout(300);
    
    // Click Apply (mobile-safe)
    const applyButtonEnd = page.locator('button:has-text("Apply")').last();
    await applyButtonEnd.scrollIntoViewIfNeeded();
    await applyButtonEnd.click({ force: true });
    await page.waitForTimeout(500);
    
    // Select location
    await page.click('button:has-text("Select location")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Strongsville")').click();
    
    // Select age group
    await page.click('button:has-text("Select age group")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("5-8 years")').click();
    
    // Select session type
    await page.click('button:has-text("Select type")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Training")').click();
    
    // Fill max players
    await page.fill('input[type="number"]', '20');
    
    // Listen for POST request
    const postPromise = page.waitForResponse(
      response => response.url().includes('/api/coach/sessions') && response.request().method() === 'POST'
    );
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Schedule Session")');
    
    // Wait for and validate POST response
    const postResponse = await postPromise;
    expect(postResponse.status()).toBe(201);
    
    // Wait for success toast to appear
    await expect(page.getByText('Session created successfully').first()).toBeVisible({ timeout: 10000 });
    
    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    // Verify no error banner appears
    await expect(page.getByText('Failed to load schedule')).not.toBeVisible();
    
    // Verify no 400 error overlay
    await expect(page.locator('text=/\\[plugin:runtime-error-plugin\\] 400 Bad Request/i')).not.toBeVisible();
    await expect(page.locator('[class*="runtime-error"]')).not.toBeVisible();
  });

  test('Dashboard uses unified component and sends correct payload', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click "Schedule New Session" button on dashboard
    const scheduleButton = page.locator('button:has-text("Schedule New Session"), button:has-text("Schedule New")').first();
    await scheduleButton.click();
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill in title with timestamp to make it unique
    const timestamp = Date.now();
    const sessionTitle = `Dashboard Session ${timestamp}`;
    await page.fill('input[placeholder*="Batting Practice"]', sessionTitle);
    
    // Open Start Date & Time picker
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    await page.waitForTimeout(500);
    
    // Verify unified calendar UI with Clear, Cancel, Apply buttons
    await expect(page.locator('button:has-text("Clear")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Apply")').first()).toBeVisible();
    
    // Select a date (day 15)
    const day15 = page.locator('button[name="day"]').filter({ hasText: '15' });
    if (await day15.count() > 0) {
      await day15.first().click();
    } else {
      await page.locator('button[name="day"]').first().click();
    }
    await page.waitForTimeout(300);
    
    // Set start time to 14:00
    await page.getByTestId('start-time-hours').selectOption('14');
    await page.getByTestId('start-time-minutes').selectOption('0');
    await page.waitForTimeout(300);
    
    // Click Apply (mobile-safe)
    const applyButtonStart2 = page.locator('button:has-text("Apply")').first();
    await applyButtonStart2.scrollIntoViewIfNeeded();
    await applyButtonStart2.click({ force: true });
    await page.waitForTimeout(500);
    
    // Open End Date & Time picker
    const endTimeButton = page.locator('button:has-text("Select date & time")').last();
    await endTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select same date
    const day15End = page.locator('button[name="day"]').filter({ hasText: '15' });
    if (await day15End.count() > 0) {
      await day15End.first().click();
    } else {
      await page.locator('button[name="day"]').first().click();
    }
    await page.waitForTimeout(300);
    
    // Set end time to 16:00
    await page.getByTestId('end-time-hours').selectOption('16');
    await page.getByTestId('end-time-minutes').selectOption('0');
    await page.waitForTimeout(300);
    
    // Click Apply (mobile-safe)
    const applyButtonEnd2 = page.locator('button:has-text("Apply")').last();
    await applyButtonEnd2.scrollIntoViewIfNeeded();
    await applyButtonEnd2.click({ force: true });
    await page.waitForTimeout(500);
    
    // Select location
    await page.click('button:has-text("Select location")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Strongsville")').click();
    
    // Select age group
    await page.click('button:has-text("Select age group")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("5-8 years")').click();
    
    // Select session type
    await page.click('button:has-text("Select type")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Training")').click();
    
    // Fill max attendees
    await page.fill('input[type="number"]', '20');
    
    // Listen for the API request and validate payload
    const requestPromise = page.waitForRequest(
      request => request.url().includes('/api/coach/sessions') && request.method() === 'POST'
    );
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Schedule Session")');
    
    // Wait for and validate the API request
    const request = await requestPromise;
    const postData = request.postDataJSON();
    
    // CRITICAL VALIDATION: Payload structure from Dashboard
    expect(postData).toHaveProperty('title', sessionTitle);
    expect(postData).toHaveProperty('date'); // Should be YYYY-MM-DD format
    expect(postData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(postData).toHaveProperty('startTime', '14:00');
    expect(postData).toHaveProperty('endTime', '16:00');
    expect(postData).toHaveProperty('location', 'Strongsville');
    expect(postData).toHaveProperty('ageGroup', '5-8 years');
    expect(postData).toHaveProperty('sessionType', 'Training');
    expect(postData).toHaveProperty('maxPlayers', 20);
    
    // Wait for success toast to appear FIRST (before modal closes)
    await expect(page.getByText('Session created successfully').first()).toBeVisible({ timeout: 10000 });
    
    // Wait for modal to close (indicates success)
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    // Verify no 400 error overlay appears
    await expect(page.locator('text=/\\[plugin:runtime-error-plugin\\] 400 Bad Request/i')).not.toBeVisible();
    await expect(page.locator('[class*="runtime-error"]')).not.toBeVisible();
    
    // SUCCESS: Payload validation passed - unified component confirmed
  });

  test('Schedule tab uses unified component and sends correct payload', async ({ page }) => {
    // Navigate to Schedule tab
    await page.goto('/coach/schedule');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click "Schedule New Session" button on Schedule page
    const scheduleButton = page.locator('button:has-text("Schedule New Session"), button:has-text("Schedule New")').first();
    await scheduleButton.click();
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill in title with timestamp to make it unique
    const timestamp = Date.now();
    const sessionTitle = `Schedule Tab Session ${timestamp}`;
    await page.fill('input[placeholder*="Batting Practice"]', sessionTitle);
    
    // Open Start Date & Time picker
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    await page.waitForTimeout(500);
    
    // Verify unified calendar UI with Clear, Cancel, Apply buttons
    await expect(page.locator('button:has-text("Clear")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Apply")').first()).toBeVisible();
    
    // Select a date (day 20)
    const day20 = page.locator('button[name="day"]').filter({ hasText: '20' });
    if (await day20.count() > 0) {
      await day20.first().click();
    } else {
      await page.locator('button[name="day"]').first().click();
    }
    await page.waitForTimeout(300);
    
    // Set start time to 10:00
    await page.getByTestId('start-time-hours').selectOption('10');
    await page.getByTestId('start-time-minutes').selectOption('0');
    await page.waitForTimeout(300);
    
    // Click Apply (mobile-safe)
    const applyButtonStart3 = page.locator('button:has-text("Apply")').first();
    await applyButtonStart3.scrollIntoViewIfNeeded();
    await applyButtonStart3.click({ force: true });
    await page.waitForTimeout(500);
    
    // Open End Date & Time picker
    const endTimeButton = page.locator('button:has-text("Select date & time")').last();
    await endTimeButton.click();
    await page.waitForTimeout(500);
    
    // Select same date
    const day20End = page.locator('button[name="day"]').filter({ hasText: '20' });
    if (await day20End.count() > 0) {
      await day20End.first().click();
    } else {
      await page.locator('button[name="day"]').first().click();
    }
    await page.waitForTimeout(300);
    
    // Set end time to 12:00
    await page.getByTestId('end-time-hours').selectOption('12');
    await page.getByTestId('end-time-minutes').selectOption('0');
    await page.waitForTimeout(300);
    
    // Click Apply (mobile-safe)
    const applyButtonEnd3 = page.locator('button:has-text("Apply")').last();
    await applyButtonEnd3.scrollIntoViewIfNeeded();
    await applyButtonEnd3.click({ force: true });
    await page.waitForTimeout(500);
    
    // Select location
    await page.click('button:has-text("Select location")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Solon")').click();
    
    // Select age group
    await page.click('button:has-text("Select age group")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("8+ years")').click();
    
    // Select session type
    await page.click('button:has-text("Select type")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Training")').click();
    
    // Fill max attendees
    await page.fill('input[type="number"]', '15');
    
    // Listen for the API request and validate payload
    const requestPromise = page.waitForRequest(
      request => request.url().includes('/api/coach/sessions') && request.method() === 'POST'
    );
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Schedule Session")');
    
    // Wait for and validate the API request
    const request = await requestPromise;
    const postData = request.postDataJSON();
    
    // CRITICAL VALIDATION: Payload structure from Schedule tab (must match Dashboard)
    expect(postData).toHaveProperty('title', sessionTitle);
    expect(postData).toHaveProperty('date'); // Should be YYYY-MM-DD format
    expect(postData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(postData).toHaveProperty('startTime', '10:00');
    expect(postData).toHaveProperty('endTime', '12:00');
    expect(postData).toHaveProperty('location', 'Solon');
    expect(postData).toHaveProperty('ageGroup', '8+ years');
    expect(postData).toHaveProperty('sessionType', 'Training');
    expect(postData).toHaveProperty('maxPlayers', 15);
    
    // Wait for success toast to appear FIRST (before modal closes)
    await expect(page.getByText('Session created successfully').first()).toBeVisible({ timeout: 10000 });
    
    // Wait for modal to close (indicates success)
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    // Verify no 400 error overlay appears
    await expect(page.locator('text=/\\[plugin:runtime-error-plugin\\] 400 Bad Request/i')).not.toBeVisible();
    await expect(page.locator('[class*="runtime-error"]')).not.toBeVisible();
    
    // SUCCESS: Payload validation passed - unified component confirmed
  });

  test('validates end time must be after start time', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click "Schedule New Session" button
    const scheduleButton = page.locator('button:has-text("Schedule New Session"), button:has-text("Schedule New")').first();
    await scheduleButton.click();
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill in title
    await page.fill('input[placeholder*="Batting Practice"]', 'Validation Test');
    
    // Set start time to 16:00
    const startTimeButton = page.locator('button:has-text("Select date & time")').first();
    await startTimeButton.click();
    await page.waitForTimeout(500);
    
    await page.locator('button[name="day"]').first().click();
    await page.getByTestId('start-time-hours').selectOption('16');
    await page.getByTestId('start-time-minutes').selectOption('0');
    const applyButtonStart4 = page.locator('button:has-text("Apply")').first();
    await applyButtonStart4.scrollIntoViewIfNeeded();
    await applyButtonStart4.click({ force: true });
    await page.waitForTimeout(500);
    
    // Set end time to 14:00 (before start time)
    const endTimeButton = page.locator('button:has-text("Select date & time")').last();
    await endTimeButton.click();
    await page.waitForTimeout(500);
    
    await page.locator('button[name="day"]').first().click();
    await page.getByTestId('end-time-hours').selectOption('14');
    await page.getByTestId('end-time-minutes').selectOption('0');
    const applyButtonEnd4 = page.locator('button:has-text("Apply")').last();
    await applyButtonEnd4.scrollIntoViewIfNeeded();
    await applyButtonEnd4.click({ force: true });
    await page.waitForTimeout(500);
    
    // Fill other required fields
    await page.click('button:has-text("Select location")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Strongsville")').click();
    
    await page.click('button:has-text("Select age group")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("5-8 years")').click();
    
    await page.click('button:has-text("Select type")');
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Training")').click();
    
    await page.fill('input[type="number"]', '20');
    
    // Try to submit - should show validation error
    await page.click('button[type="submit"]:has-text("Schedule Session")');
    
    // Wait a moment for validation
    await page.waitForTimeout(1000);
    
    // Verify error message appears
    await expect(page.locator('text=/end time must be after start time/i')).toBeVisible({ timeout: 5000 });
  });
});
