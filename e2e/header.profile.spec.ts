import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';
import { HeaderPage } from './pages/HeaderPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { TestHelpers } from './utils/helpers';
import testData from './utils/testData';

test.describe('Header Profile Menu', () => {
  let authPage: AuthPage;
  let headerPage: HeaderPage;
  let adminDashboardPage: AdminDashboardPage;
  let parentDashboardPage: ParentDashboardPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page objects and helpers
    authPage = new AuthPage(page);
    headerPage = new HeaderPage(page);
    adminDashboardPage = new AdminDashboardPage(page);
    parentDashboardPage = new ParentDashboardPage(page);
    helpers = new TestHelpers(page);
  });

  test('profile menu works for parent user', async ({ page }) => {
    // Act: Login as parent user
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);

    // Assert: Should be on parent dashboard
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.parentDashboard}`);

    // Assert: Check user menu trigger is visible
    await expect(headerPage.isUserMenuVisible()).resolves.toBe(true);

    // Act: Click user menu trigger
    await headerPage.openUserMenu();

    // Assert: Check menu items are visible
    await expect(headerPage.isProfileMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSettingsMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSignOutMenuItemVisible()).resolves.toBe(true);

    // Act & Assert: Test Profile menu item
    await headerPage.clickProfile();
    await helpers.waitForNavigation(testData.urls.account);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.account}`);

    // Act & Assert: Go back to dashboard and test Settings menu item
    await parentDashboardPage.goto();
    await helpers.waitForNavigation(testData.urls.parentDashboard);
    await headerPage.openUserMenu();
    await headerPage.clickSettings();
    await helpers.waitForNavigation(testData.urls.account);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.account}`);

    // Act & Assert: Go back to dashboard and test Sign out menu item
    await parentDashboardPage.goto();
    await helpers.waitForNavigation(testData.urls.parentDashboard);
    await headerPage.signOut();
    await helpers.waitForNavigation(testData.urls.auth);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.auth}`);
  });

  test('profile menu works for admin user', async ({ page }) => {
    // Act: Login as admin user
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    // Assert: Should be on admin dashboard
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.admin}`);

    // Assert: Check user menu trigger is visible
    await expect(headerPage.isUserMenuVisible()).resolves.toBe(true);

    // Assert: Check role badge is visible
    await expect(headerPage.isRoleBadgeVisible()).resolves.toBe(true);
    
    const roleBadgeText = await headerPage.getRoleBadgeText();
    expect(roleBadgeText).toContain(testData.users.admin.role);

    // Act: Click user menu trigger
    await headerPage.openUserMenu();

    // Assert: Check menu items are visible
    await expect(headerPage.isProfileMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSettingsMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSignOutMenuItemVisible()).resolves.toBe(true);

    // Act & Assert: Test Profile menu item
    await headerPage.clickProfile();
    await helpers.waitForNavigation(testData.urls.account);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.account}`);
  });

  test('role badge displays correct role for each user type', async ({ page }) => {
    // Test admin role badge
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    const adminRoleText = await headerPage.getRoleBadgeText();
    expect(adminRoleText).toContain(testData.users.admin.role);

    // Test parent role badge
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);

    const parentRoleText = await headerPage.getRoleBadgeText();
    expect(parentRoleText).toContain(testData.users.parent.role);
  });
});