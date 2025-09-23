import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for testing
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Admin Dashboard - Accessibility', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for accessibility violations
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', accessibilityScanResults.violations);
    }
  });

  test('Schedule Page - Accessibility', async ({ page }) => {
    // Navigate to schedule page
    await page.goto('/schedule');
    await expect(page.locator('h1')).toContainText('Schedule');

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for accessibility violations
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', accessibilityScanResults.violations);
    }
  });

  test('Parent Dashboard - Accessibility', async ({ page }) => {
    // Switch to parent view
    await page.click('[data-testid="user-dropdown"]');
    await page.click('text=Sign out');
    await page.waitForURL('/auth');

    // Login as parent
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Run accessibility scan on parent dashboard
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for accessibility violations
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', accessibilityScanResults.violations);
    }
  });

  test('Login Page - Accessibility', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth');
    await expect(page.locator('h1')).toContainText('Login');

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for accessibility violations
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', accessibilityScanResults.violations);
    }
  });

  test('Form Accessibility - Session Creation', async ({ page }) => {
    // Navigate to admin sessions page
    await page.goto('/admin/sessions');
    
    // Open create session dialog
    await page.click('[data-testid="create-session-button"]');
    await expect(page.locator('[data-testid="schedule-dialog"]')).toBeVisible();

    // Run accessibility scan on the form
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Check for accessibility violations
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', accessibilityScanResults.violations);
    }
  });

  test('Navigation Accessibility', async ({ page }) => {
    // Test sidebar navigation accessibility
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (await sidebar.isVisible()) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="sidebar"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }

    // Test mobile navigation accessibility
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="mobile-menu"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('Button and Link Accessibility', async ({ page }) => {
    // Test that all buttons have proper accessibility attributes
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Buttons should have either text content, aria-label, or title
      expect(text || ariaLabel || title).toBeTruthy();
    }

    // Test that all links have proper accessibility attributes
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      
      // Links should have either text content, aria-label, or title
      expect(text || ariaLabel || title).toBeTruthy();
    }
  });

  test('Form Field Accessibility', async ({ page }) => {
    // Navigate to admin sessions page
    await page.goto('/admin/sessions');
    
    // Open create session dialog
    await page.click('[data-testid="create-session-button"]');
    await expect(page.locator('[data-testid="schedule-dialog"]')).toBeVisible();

    // Test form fields have proper labels
    const formFields = [
      { selector: '[data-testid="session-title"]', label: 'Session Title' },
      { selector: '[data-testid="session-type"]', label: 'Session Type' },
      { selector: '[data-testid="session-start"]', label: 'Start Time' },
      { selector: '[data-testid="session-end"]', label: 'End Time' },
      { selector: '[data-testid="session-location"]', label: 'Location' }
    ];

    for (const field of formFields) {
      const input = page.locator(field.selector);
      if (await input.isVisible()) {
        // Check if field has associated label
        const label = page.locator(`label[for="${await input.getAttribute('id')}"]`);
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        
        // Field should have either a label, aria-label, or placeholder
        expect(await label.count() > 0 || ariaLabel || placeholder).toBeTruthy();
      }
    }
  });

  test('Color Contrast and Visual Accessibility', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Run accessibility scan focusing on color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    // Check for color contrast violations
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Color contrast violations found:', accessibilityScanResults.violations);
    }
  });

  test('Keyboard Navigation', async ({ page }) => {
    // Test keyboard navigation through the page
    await page.goto('/dashboard');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Test that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test Enter key on buttons
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible()) {
      await firstButton.focus();
      await page.keyboard.press('Enter');
    }
  });
});

