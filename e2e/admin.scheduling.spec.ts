import { test, expect } from '@playwright/test';

test.describe('Admin Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication as admin
    await page.goto('/auth');
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'Test1234!');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/');
  });

  test('admin can create a future practice session', async ({ page }) => {
    // Navigate to admin sessions page
    await page.goto('/admin/sessions');
    await expect(page.locator('h1')).toContainText('Session Management');

    // Click Create Session button
    await page.click('[data-testid="create-session"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill out the session form
    await page.selectOption('select', 'practice');
    await page.fill('input[type="number"]', '1');
    await page.fill('input[value=""]', 'Test Team');
    
    // Set future date (3 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const futureDateString = futureDate.toISOString().slice(0, 16);
    
    await page.fill('input[type="datetime-local"]', futureDateString);
    
    // Set end time (2 hours later)
    const endDate = new Date(futureDate);
    endDate.setHours(endDate.getHours() + 2);
    const endDateString = endDate.toISOString().slice(0, 16);
    
    await page.fill('input[type="datetime-local"]:nth-of-type(2)', endDateString);
    
    await page.fill('input[placeholder="Location"]', 'Test Field');
    await page.fill('input[placeholder="Opponent"]', 'Test Opponent');
    await page.fill('textarea', 'Test notes');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success message and dialog to close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=Session Created')).toBeVisible();

    // Verify session appears in the list
    await expect(page.locator('text=Test Team')).toBeVisible();
    await expect(page.locator('text=Test Field')).toBeVisible();
  });

  test('admin can create a future game session', async ({ page }) => {
    // Navigate to admin sessions page
    await page.goto('/admin/sessions');

    // Click Create Session button
    await page.click('[data-testid="create-session"]');

    // Fill out the session form for a game
    await page.selectOption('select', 'game');
    await page.fill('input[type="number"]', '2');
    await page.fill('input[value=""]', 'Game Team');
    
    // Set future date (5 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const futureDateString = futureDate.toISOString().slice(0, 16);
    
    await page.fill('input[type="datetime-local"]', futureDateString);
    
    // Set end time (3 hours later)
    const endDate = new Date(futureDate);
    endDate.setHours(endDate.getHours() + 3);
    const endDateString = endDate.toISOString().slice(0, 16);
    
    await page.fill('input[type="datetime-local"]:nth-of-type(2)', endDateString);
    
    await page.fill('input[placeholder="Location"]', 'Game Field');
    await page.fill('input[placeholder="Opponent"]', 'Rival Team');
    await page.fill('textarea', 'Championship game');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success and verify session appears
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=Game Team')).toBeVisible();
    await expect(page.locator('text=Rival Team')).toBeVisible();
  });

  test('created session appears in admin schedule view', async ({ page }) => {
    // First create a session (reuse the logic from above)
    await page.goto('/admin/sessions');
    await page.click('[data-testid="create-session"]');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const futureDateString = futureDate.toISOString().slice(0, 16);
    
    await page.selectOption('select', 'practice');
    await page.fill('input[type="number"]', '1');
    await page.fill('input[value=""]', 'Schedule Test Team');
    await page.fill('input[type="datetime-local"]', futureDateString);
    
    const endDate = new Date(futureDate);
    endDate.setHours(endDate.getHours() + 2);
    const endDateString = endDate.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]:nth-of-type(2)', endDateString);
    
    await page.fill('input[placeholder="Location"]', 'Schedule Field');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Navigate to schedule page
    await page.goto('/schedule');
    
    // Verify the session appears in the schedule
    await expect(page.locator('text=Schedule Test Team')).toBeVisible();
    await expect(page.locator('text=Schedule Field')).toBeVisible();
  });
});
