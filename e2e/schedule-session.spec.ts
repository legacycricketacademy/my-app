/**
 * E2E Test: Schedule Session Modal
 * Tests the schedule session modal functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Schedule Session Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should open modal and create session successfully', async ({ page }) => {
    // Click on "Schedule New Session" button
    await page.click('text=Schedule New Session');
    
    // Check that modal is open
    await expect(page.locator('text=Schedule New Training Session')).toBeVisible();
    
    // Fill in session details
    await page.fill('input[placeholder="e.g. Batting Practice"]', 'Test Session');
    await page.fill('textarea[placeholder="Add any additional details about the session"]', 'Test description');
    
    // Select location
    await page.click('button[role="combobox"]:has-text("Select location")');
    await page.click('text=Main Ground');
    
    // Select age group
    await page.click('button[role="combobox"]:has-text("Select age group")');
    await page.click('text=Under 12s');
    
    // Select session type
    await page.click('button[role="combobox"]:has-text("Select type")');
    await page.click('text=Training');
    
    // Set max attendees
    await page.fill('input[type="number"]', '20');
    
    // Set start time (click on date picker)
    await page.click('button:has-text("Select date & time")');
    // For simplicity, we'll just click OK on the current date
    await page.click('button:has-text("OK")');
    
    // Set end time
    await page.click('button:has-text("Select date & time")').nth(1);
    await page.click('button:has-text("OK")');
    
    // Submit the form
    await page.click('button:has-text("Schedule Session")');
    
    // Check that modal closes and success message appears
    await expect(page.locator('text=Session Scheduled')).toBeVisible();
    await expect(page.locator('text=The training session has been successfully scheduled')).toBeVisible();
  });

  test('should close modal on cancel without creating session', async ({ page }) => {
    // Click on "Schedule New Session" button
    await page.click('text=Schedule New Session');
    
    // Check that modal is open
    await expect(page.locator('text=Schedule New Training Session')).toBeVisible();
    
    // Click cancel button
    await page.click('button:has-text("Cancel")');
    
    // Check that modal is closed
    await expect(page.locator('text=Schedule New Training Session')).not.toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    // Click on "Schedule New Session" button
    await page.click('text=Schedule New Session');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Schedule Session")');
    
    // Check that validation errors appear
    await expect(page.locator('text=Title must be at least 3 characters')).toBeVisible();
    await expect(page.locator('text=Please select a start date & time')).toBeVisible();
    await expect(page.locator('text=Please select an end date & time')).toBeVisible();
    await expect(page.locator('text=Location is required')).toBeVisible();
    await expect(page.locator('text=Age group is required')).toBeVisible();
    await expect(page.locator('text=Session type is required')).toBeVisible();
    await expect(page.locator('text=Maximum attendees is required')).toBeVisible();
  });
});
