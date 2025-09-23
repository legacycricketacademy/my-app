import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { HeaderPage } from '../pages/HeaderPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { ParentDashboardPage } from '../pages/ParentDashboardPage';
import { TestHelpers } from '../utils/helpers';
import testData from '../utils/testData';

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

    // Assert: Check role badge is visible
    await expect(headerPage.isRoleBadgeVisible()).resolves.toBe(true);
    
    const roleBadgeText = await headerPage.getRoleBadgeText();
    expect(roleBadgeText).toContain(testData.users.parent.role);

    // Act: Open user menu
    await headerPage.openUserMenu();

    // Assert: Check menu items are visible
    await expect(headerPage.isProfileMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSettingsMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSignOutMenuItemVisible()).resolves.toBe(true);

    // Act: Click Profile
    await headerPage.clickProfile();
    await helpers.waitForNavigation(testData.urls.account);

    // Assert: Should navigate to account page
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.account}`);
  });

  test('profile menu works for admin user', async ({ page }) => {
    // Act: Login as admin user
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    // Assert: Check role badge is visible
    await expect(headerPage.isRoleBadgeVisible()).resolves.toBe(true);
    
    const roleBadgeText = await headerPage.getRoleBadgeText();
    expect(roleBadgeText).toContain(testData.users.admin.role);

    // Act: Open user menu
    await headerPage.openUserMenu();

    // Assert: Check menu items are visible
    await expect(headerPage.isProfileMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSettingsMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSignOutMenuItemVisible()).resolves.toBe(true);

    // Act: Click Profile
    await headerPage.clickProfile();
    await helpers.waitForNavigation(testData.urls.account);

    // Assert: Should navigate to account page
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.account}`);
  });

  test('sign out functionality works for both user types', async ({ page }) => {
    // Test with admin user
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    // Act: Sign out
    await headerPage.signOut();
    await helpers.waitForNavigation(testData.urls.auth);

    // Assert: Should be redirected to auth page
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.auth}`);
    await expect(authPage.isSignInTitleVisible()).resolves.toBe(true);

    // Test with parent user
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);

    // Act: Sign out
    await headerPage.signOut();
    await helpers.waitForNavigation(testData.urls.auth);

    // Assert: Should be redirected to auth page
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.auth}`);
    await expect(authPage.isSignInTitleVisible()).resolves.toBe(true);
  });

  test('user menu is accessible and functional', async ({ page }) => {
    // Act: Login as admin to ensure user menu is visible
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    // Assert: User menu trigger should be visible
    await expect(headerPage.isUserMenuVisible()).resolves.toBe(true);

    // Act: Open user menu
    await headerPage.openUserMenu();

    // Assert: All menu items should be visible
    await expect(headerPage.isProfileMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSettingsMenuItemVisible()).resolves.toBe(true);
    await expect(headerPage.isSignOutMenuItemVisible()).resolves.toBe(true);
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

  test('settings menu item navigates correctly', async ({ page }) => {
    // Act: Login as admin user
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    // Act: Open user menu and click settings
    await headerPage.openUserMenu();
    await headerPage.clickSettings();
    await helpers.waitForNavigation(testData.urls.account);

    // Assert: Should navigate to account page with settings tab
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.account}`);
  });
});
