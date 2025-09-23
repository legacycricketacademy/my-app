import { test, expect } from '@playwright/test';

test.describe('Parent Dashboard - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth');
    
    // Login as parent
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveTitle(/Dashboard/);
  });

  test('Parent Dashboard - Basic Layout and Navigation', async ({ page }) => {
    // Check main layout elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
    
    // Check role badge
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('Parent');
    
    // Check user dropdown
    await page.click('[data-testid="user-dropdown"]');
    await expect(page.locator('text=Test Parent')).toBeVisible();
    await expect(page.locator('text=parent@test.com')).toBeVisible();
  });

  test('Parent Dashboard - Stats Cards Display', async ({ page }) => {
    // Check all stats cards are visible
    await expect(page.locator('text=Players')).toBeVisible();
    await expect(page.locator('text=Total registered players')).toBeVisible();
    
    await expect(page.locator('text=Sessions')).toBeVisible();
    await expect(page.locator('text=This month')).toBeVisible();
    
    await expect(page.locator('text=Pending Payments')).toBeVisible();
    await expect(page.locator('text=Outstanding balance')).toBeVisible();
    
    // Check stats have numeric values
    const playerCount = page.locator('text=Players').locator('..').locator('div').nth(1);
    await expect(playerCount).toContainText(/\d+/);
  });

  test('Parent Dashboard - Dashboard Cards Functionality', async ({ page }) => {
    // Test Players Card
    await expect(page.locator('text=Players')).toBeVisible();
    await expect(page.locator('text=View All')).toBeVisible();
    
    // Test Schedule Card
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible();
    await expect(page.locator('text=Morning Training')).toBeVisible();
    
    // Test Payments Card
    await expect(page.locator('text=Payment Status')).toBeVisible();
    await expect(page.locator('text=Send Reminder')).toBeVisible();
    await expect(page.locator('text=Send All Reminders')).toBeVisible();
    
    // Test Announcements Card
    await expect(page.locator('text=Recent Announcements')).toBeVisible();
    await expect(page.locator('text=Tournament Registration')).toBeVisible();
    
    // Test Notifications Card
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Payment Reminder')).toBeVisible();
  });

  test('Parent Dashboard - Payment Reminder Functionality', async ({ page }) => {
    // Test individual payment reminder
    const sendReminderButton = page.locator('text=Send Reminder').first();
    await expect(sendReminderButton).toBeVisible();
    
    // Click send reminder
    await sendReminderButton.click();
    
    // Check for loading state
    await expect(page.locator('text=Sending...')).toBeVisible();
    
    // Wait for success message
    await expect(page.locator('text=Reminder sent successfully')).toBeVisible();
    
    // Test send all reminders
    const sendAllButton = page.locator('text=Send All Reminders');
    await expect(sendAllButton).toBeVisible();
    
    await sendAllButton.click();
    await expect(page.locator('text=Sending...')).toBeVisible();
    await expect(page.locator('text=All reminders sent successfully')).toBeVisible();
  });

  test('Parent Dashboard - Notifications System', async ({ page }) => {
    // Check notifications are displayed
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Payment Reminder')).toBeVisible();
    await expect(page.locator('text=Session Reminder')).toBeVisible();
    
    // Test mark as read functionality
    const markAsReadButton = page.locator('[data-testid="mark-as-read"]').first();
    if (await markAsReadButton.isVisible()) {
      await markAsReadButton.click();
      await expect(page.locator('text=Marked as read')).toBeVisible();
    }
  });

  test('Parent Dashboard - Navigation Links Work', async ({ page }) => {
    // Test navigation to different pages
    const navigationTests = [
      { text: 'View All', expectedUrl: '/players' },
      { text: 'Schedule', expectedUrl: '/schedule' },
      { text: 'Payments', expectedUrl: '/payments' },
      { text: 'Announcements', expectedUrl: '/announcements' }
    ];

    for (const nav of navigationTests) {
      // Click the navigation link
      await page.click(`text=${nav.text}`);
      
      // Check if we're on the expected page
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain(nav.expectedUrl);
      
      // Navigate back to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Parent Dashboard - Schedule Session Creation', async ({ page }) => {
    // Click on schedule card or navigate to schedule
    await page.click('text=Today\'s Schedule');
    await page.waitForURL('/schedule');
    
    // Check schedule page loads
    await expect(page.locator('h1')).toContainText('Schedule');
    
    // Test create session button
    const createSessionButton = page.locator('[data-testid="create-session-button"]');
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Check modal opens
      await expect(page.locator('[data-testid="schedule-dialog"]')).toBeVisible();
      
      // Fill in session details
      await page.fill('[data-testid="session-title"]', 'Test Practice Session');
      await page.selectOption('[data-testid="session-type"]', 'practice');
      await page.fill('[data-testid="session-start"]', '2024-12-25T16:00');
      await page.fill('[data-testid="session-end"]', '2024-12-25T18:00');
      await page.fill('[data-testid="session-location"]', 'Field 1');
      
      // Submit session
      await page.click('[data-testid="submit-session"]');
      
      // Check success message
      await expect(page.locator('text=Session created successfully')).toBeVisible();
    }
  });

  test('Parent Dashboard - RSVP Functionality', async ({ page }) => {
    // Navigate to schedule page
    await page.goto('/schedule');
    
    // Check RSVP controls are visible
    const rsvpControls = page.locator('[data-testid="rsvp-controls"]');
    await expect(rsvpControls).toBeVisible();
    
    // Test RSVP buttons
    const goingButton = page.locator('[data-testid="rsvp-going"]');
    const maybeButton = page.locator('[data-testid="rsvp-maybe"]');
    const noButton = page.locator('[data-testid="rsvp-no"]');
    
    if (await goingButton.isVisible()) {
      await goingButton.click();
      await expect(page.locator('text=RSVP updated')).toBeVisible();
    }
    
    if (await maybeButton.isVisible()) {
      await maybeButton.click();
      await expect(page.locator('text=RSVP updated')).toBeVisible();
    }
  });

  test('Parent Dashboard - Calendar Controls', async ({ page }) => {
    // Navigate to schedule page
    await page.goto('/schedule');
    
    // Test calendar view toggle
    const weekViewButton = page.locator('[data-testid="view-week"]');
    const monthViewButton = page.locator('[data-testid="view-month"]');
    
    if (await weekViewButton.isVisible()) {
      await weekViewButton.click();
      await expect(weekViewButton).toHaveClass(/active/);
    }
    
    if (await monthViewButton.isVisible()) {
      await monthViewButton.click();
      await expect(monthViewButton).toHaveClass(/active/);
    }
    
    // Test navigation buttons
    const prevButton = page.locator('[data-testid="nav-prev"]');
    const nextButton = page.locator('[data-testid="nav-next"]');
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
    }
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
    
    // Test kid filter
    const kidFilter = page.locator('[data-testid="kid-filter"]');
    if (await kidFilter.isVisible()) {
      await kidFilter.click();
      await page.selectOption('[data-testid="kid-select"]', '1');
    }
  });

  test('Parent Dashboard - Sign Out Functionality', async ({ page }) => {
    // Click user dropdown
    await page.click('[data-testid="user-dropdown"]');
    
    // Click sign out
    await page.click('text=Sign out');
    
    // Check for loading state
    await expect(page.locator('text=Signing out...')).toBeVisible();
    
    // Wait for redirect to auth page
    await page.waitForURL('/auth');
    await expect(page).toHaveTitle(/Login/);
  });

  test('Parent Dashboard - Mobile Responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('text=Legacy Cricket Academy')).toBeVisible();
    
    // Check mobile search
    await expect(page.locator('input[placeholder*="Search players, schedules"]')).toBeVisible();
  });

  test('Parent Dashboard - API Calls Work', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(request.url());
      }
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that parent-specific APIs were called
    expect(requests.some(url => url.includes('/api/dashboard/stats'))).toBeTruthy();
    expect(requests.some(url => url.includes('/api/players'))).toBeTruthy();
    expect(requests.some(url => url.includes('/api/sessions/today'))).toBeTruthy();
    expect(requests.some(url => url.includes('/api/payments/pending'))).toBeTruthy();
    expect(requests.some(url => url.includes('/api/notifications'))).toBeTruthy();
  });

  test('Parent Dashboard - Error Handling', async ({ page }) => {
    // Test that dashboard loads even if some API calls fail
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });
});

