/**
 * E2E Test: Add Player
 * Tests the add player functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Add Player Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should add new player and see it in the list', async ({ page }) => {
    // Navigate to players page
    await page.goto('/players');
    
    // Click on "Add New Player" button
    await page.click('text=Add New Player');
    
    // Check that modal is open
    await expect(page.locator('text=Add New Player')).toBeVisible();
    
    // Fill in player details
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Player');
    await page.fill('input[name="parentName"]', 'Test Parent');
    await page.fill('input[name="parentEmail"]', 'testparent@example.com');
    
    // Select age group
    await page.click('button[role="combobox"]:has-text("Under 12s")');
    await page.click('text=Under 14s');
    
    // Select player type
    await page.click('button[role="combobox"]:has-text("Batsman")');
    await page.click('text=Bowler');
    
    // Set date of birth
    await page.fill('input[type="date"]', '2010-01-01');
    
    // Fill optional fields
    await page.fill('input[name="emergencyContact"]', '555-0123');
    await page.fill('input[name="medicalInformation"]', 'None');
    
    // Submit the form
    await page.click('button:has-text("Save Player")');
    
    // Check that success message appears
    await expect(page.locator('text=Player created successfully')).toBeVisible();
    
    // Check that modal closes
    await expect(page.locator('text=Add New Player')).not.toBeVisible();
    
    // Check that new player appears in the list
    await expect(page.locator('text=Test Player')).toBeVisible();
    await expect(page.locator('text=Under 14s')).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    // Navigate to players page
    await page.goto('/players');
    
    // Click on "Add New Player" button
    await page.click('text=Add New Player');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Save Player")');
    
    // Check that validation errors appear
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Last name is required')).toBeVisible();
    await expect(page.locator('text=Date of birth is required')).toBeVisible();
    await expect(page.locator('text=Parent name is required')).toBeVisible();
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should close modal on cancel without creating player', async ({ page }) => {
    // Navigate to players page
    await page.goto('/players');
    
    // Click on "Add New Player" button
    await page.click('text=Add New Player');
    
    // Check that modal is open
    await expect(page.locator('text=Add New Player')).toBeVisible();
    
    // Click cancel button
    await page.click('button:has-text("Cancel")');
    
    // Check that modal is closed
    await expect(page.locator('text=Add New Player')).not.toBeVisible();
  });
});
