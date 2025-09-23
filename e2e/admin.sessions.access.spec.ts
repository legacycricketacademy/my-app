import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { AdminSessionsPage } from './pages/AdminSessionsPage';
import { TestHelpers } from './utils/helpers';
import testData from './utils/testData';

test.describe('Admin Sessions Access', () => {
  let authPage: AuthPage;
  let adminSessionsPage: AdminSessionsPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page objects and helpers
    authPage = new AuthPage(page);
    adminSessionsPage = new AdminSessionsPage(page);
    helpers = new TestHelpers(page);
  });

  test('admin user can access /admin/sessions and stays on the page', async ({ page }) => {
    // Act: Login as admin user
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    // Act: Navigate to admin sessions page
    await adminSessionsPage.goto();
    await helpers.waitForNavigation(testData.urls.adminSessions);

    // Assert: Should stay on admin sessions page (no redirect to /)
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.adminSessions}`);

    // Assert: Should see admin sessions page content
    await expect(adminSessionsPage.isPageVisible()).resolves.toBe(true);
    
    const pageTitle = await adminSessionsPage.getPageTitleText();
    expect(pageTitle).toContain('Session Management');

    // Assert: Check that email banner IS visible (should be shown for admins)
    await expect(page.locator('[data-testid="email-banner"]')).toBeVisible();
  });

  test('parent user cannot access /admin/sessions and gets redirected', async ({ page }) => {
    // Act: Login as parent user
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);

    // Act: Try to navigate to admin sessions page
    await adminSessionsPage.goto();
    await helpers.waitForNavigation(testData.urls.parentDashboard, testData.timeouts.medium);

    // Assert: Should be redirected to parent dashboard
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.parentDashboard}`);

    // Assert: Should NOT see admin sessions page content
    await expect(adminSessionsPage.isPageVisible()).resolves.toBe(false);
  });

  test('unauthenticated user gets redirected to auth', async ({ page }) => {
    // Act: Try to access admin sessions without authentication
    await adminSessionsPage.goto();
    await helpers.waitForNavigation(testData.urls.auth, testData.timeouts.medium);

    // Assert: Should be redirected to auth page
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.auth}`);
  });
});