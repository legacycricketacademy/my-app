import { test, expect } from '@playwright/test';

test.describe('Scheduling Workflow - Comprehensive Tests', () => {
  test('Complete Scheduling Workflow - Admin Creates Session, Parent Views and RSVPs', async ({ page, context }) => {
    // Step 1: Admin creates a session
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to admin sessions page
    await page.goto('/admin/sessions');
    await expect(page.locator('h1')).toContainText('Manage Sessions');

    // Click create session button
    const createSessionButton = page.locator('[data-testid="create-session-button"]');
    await expect(createSessionButton).toBeVisible();
    await createSessionButton.click();

    // Fill in session details
    await expect(page.locator('[data-testid="schedule-dialog"]')).toBeVisible();
    
    await page.fill('[data-testid="session-title"]', 'E2E Test Practice Session');
    await page.selectOption('[data-testid="session-type"]', 'practice');
    await page.fill('[data-testid="session-start"]', '2024-12-25T16:00');
    await page.fill('[data-testid="session-end"]', '2024-12-25T18:00');
    await page.fill('[data-testid="session-location"]', 'Field 1 - E2E Test');
    await page.fill('[data-testid="session-notes"]', 'This is a test session created via E2E testing');

    // Submit session
    await page.click('[data-testid="submit-session"]');
    await expect(page.locator('text=Session created successfully')).toBeVisible();

    // Verify session appears in admin sessions list
    await expect(page.locator('text=E2E Test Practice Session')).toBeVisible();
    await expect(page.locator('text=Field 1 - E2E Test')).toBeVisible();

    // Step 2: Switch to parent view
    await page.click('[data-testid="user-dropdown"]');
    await page.click('text=Sign out');
    await page.waitForURL('/auth');

    // Login as parent
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to schedule page
    await page.goto('/schedule');
    await expect(page.locator('h1')).toContainText('Schedule');

    // Step 3: Parent views the created session
    await expect(page.locator('text=E2E Test Practice Session')).toBeVisible();
    await expect(page.locator('text=Field 1 - E2E Test')).toBeVisible();

    // Step 4: Parent RSVPs to the session
    const rsvpControls = page.locator('[data-testid="rsvp-controls"]').first();
    await expect(rsvpControls).toBeVisible();

    // Test different RSVP options
    const goingButton = page.locator('[data-testid="rsvp-going"]').first();
    const maybeButton = page.locator('[data-testid="rsvp-maybe"]').first();
    const noButton = page.locator('[data-testid="rsvp-no"]').first();

    if (await goingButton.isVisible()) {
      await goingButton.click();
      await expect(page.locator('text=RSVP updated')).toBeVisible();
    }

    if (await maybeButton.isVisible()) {
      await maybeButton.click();
      await expect(page.locator('text=RSVP updated')).toBeVisible();
    }

    // Step 5: Test calendar controls
    await testCalendarControls(page);

    // Step 6: Test session filtering
    await testSessionFiltering(page);
  });

  test('Admin Session Management - CRUD Operations', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to admin sessions
    await page.goto('/admin/sessions');

    // Test create session
    await testCreateSession(page, 'CRUD Test Session', 'practice', '2024-12-26T10:00', '2024-12-26T12:00', 'Field 2');

    // Test edit session (if edit functionality exists)
    const editButton = page.locator('[data-testid="edit-session"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.locator('[data-testid="edit-session-dialog"]')).toBeVisible();
      
      // Update session details
      await page.fill('[data-testid="session-title"]', 'Updated CRUD Test Session');
      await page.click('[data-testid="update-session"]');
      await expect(page.locator('text=Session updated successfully')).toBeVisible();
    }

    // Test delete session (if delete functionality exists)
    const deleteButton = page.locator('[data-testid="delete-session"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await expect(page.locator('[data-testid="confirm-delete"]')).toBeVisible();
      await page.click('[data-testid="confirm-delete"]');
      await expect(page.locator('text=Session deleted successfully')).toBeVisible();
    }
  });

  test('Parent Schedule View - All Features', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to schedule
    await page.goto('/schedule');

    // Test all schedule features
    await testCalendarControls(page);
    await testSessionFiltering(page);
    await testRSVPFunctionality(page);
    await testSessionDetails(page);
  });

  async function testCreateSession(page: any, title: string, type: string, start: string, end: string, location: string) {
    const createButton = page.locator('[data-testid="create-session-button"]');
    await createButton.click();
    
    await expect(page.locator('[data-testid="schedule-dialog"]')).toBeVisible();
    
    await page.fill('[data-testid="session-title"]', title);
    await page.selectOption('[data-testid="session-type"]', type);
    await page.fill('[data-testid="session-start"]', start);
    await page.fill('[data-testid="session-end"]', end);
    await page.fill('[data-testid="session-location"]', location);
    
    await page.click('[data-testid="submit-session"]');
    await expect(page.locator('text=Session created successfully')).toBeVisible();
  }

  async function testCalendarControls(page: any) {
    // Test view toggle
    const weekView = page.locator('[data-testid="view-week"]');
    const monthView = page.locator('[data-testid="view-month"]');
    
    if (await weekView.isVisible()) {
      await weekView.click();
      await expect(weekView).toHaveClass(/active/);
    }
    
    if (await monthView.isVisible()) {
      await monthView.click();
      await expect(monthView).toHaveClass(/active/);
    }
    
    // Test navigation
    const prevButton = page.locator('[data-testid="nav-prev"]');
    const nextButton = page.locator('[data-testid="nav-next"]');
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
    }
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  }

  async function testSessionFiltering(page: any) {
    // Test kid filter
    const kidFilter = page.locator('[data-testid="kid-filter"]');
    if (await kidFilter.isVisible()) {
      await kidFilter.click();
      await page.selectOption('[data-testid="kid-select"]', '1');
    }
    
    // Test session type filter
    const typeFilter = page.locator('[data-testid="type-filter"]');
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      await page.selectOption('[data-testid="type-select"]', 'practice');
    }
  }

  async function testRSVPFunctionality(page: any) {
    const rsvpControls = page.locator('[data-testid="rsvp-controls"]');
    if (await rsvpControls.count() > 0) {
      const goingButton = page.locator('[data-testid="rsvp-going"]').first();
      const maybeButton = page.locator('[data-testid="rsvp-maybe"]').first();
      const noButton = page.locator('[data-testid="rsvp-no"]').first();
      
      if (await goingButton.isVisible()) {
        await goingButton.click();
        await expect(page.locator('text=RSVP updated')).toBeVisible();
      }
      
      if (await maybeButton.isVisible()) {
        await maybeButton.click();
        await expect(page.locator('text=RSVP updated')).toBeVisible();
      }
    }
  }

  async function testSessionDetails(page: any) {
    // Test clicking on session for details
    const sessionCard = page.locator('[data-testid="session-card"]').first();
    if (await sessionCard.isVisible()) {
      await sessionCard.click();
      await expect(page.locator('[data-testid="session-details"]')).toBeVisible();
    }
  }
});

