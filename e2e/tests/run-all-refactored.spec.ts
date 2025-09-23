import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { ParentDashboardPage } from '../pages/ParentDashboardPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminSessionsPage } from '../pages/AdminSessionsPage';
import { HeaderPage } from '../pages/HeaderPage';
import { TestHelpers } from '../utils/helpers';
import testData from '../utils/testData';

test.describe('Comprehensive Test Suite - Refactored', () => {
  let authPage: AuthPage;
  let parentDashboardPage: ParentDashboardPage;
  let adminDashboardPage: AdminDashboardPage;
  let adminSessionsPage: AdminSessionsPage;
  let headerPage: HeaderPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize all page objects and helpers
    authPage = new AuthPage(page);
    parentDashboardPage = new ParentDashboardPage(page);
    adminDashboardPage = new AdminDashboardPage(page);
    adminSessionsPage = new AdminSessionsPage(page);
    headerPage = new HeaderPage(page);
    helpers = new TestHelpers(page);
  });

  test('Complete Parent User Journey', async ({ page }) => {
    // Act: Login as parent
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);

    // Assert: Verify parent dashboard
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.parentDashboard}`);
    await expect(parentDashboardPage.isDashboardTitleVisible()).resolves.toBe(true);

    // Act & Assert: Test all dashboard cards
    await expect(parentDashboardPage.isStatsCardVisible()).resolves.toBe(true);
    await expect(parentDashboardPage.isAnnouncementsCardVisible()).resolves.toBe(true);
    await expect(parentDashboardPage.isScheduleCardVisible()).resolves.toBe(true);

    // Act & Assert: Test tab navigation
    await parentDashboardPage.clickPlayerTab();
    await expect(parentDashboardPage.isPlayersCardVisible()).resolves.toBe(true);

    await parentDashboardPage.clickFitnessTab();
    await expect(parentDashboardPage.isMealPlanCardVisible()).resolves.toBe(true);

    await parentDashboardPage.clickPaymentsTab();
    await expect(parentDashboardPage.isPaymentCardVisible()).resolves.toBe(true);

    // Act & Assert: Test header functionality
    await expect(headerPage.isRoleBadgeVisible()).resolves.toBe(true);
    const roleText = await headerPage.getRoleBadgeText();
    expect(roleText).toContain(testData.users.parent.role);

    // Act & Assert: Test user menu
    await headerPage.openUserMenu();
    await expect(headerPage.isProfileMenuItemVisible()).resolves.toBe(true);
    await headerPage.clickProfile();
    await helpers.waitForNavigation(testData.urls.account);
  });

  test('Complete Admin User Journey', async ({ page }) => {
    // Act: Login as admin
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    // Assert: Verify admin dashboard
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.admin}`);
    await expect(adminDashboardPage.isDashboardTitleVisible()).resolves.toBe(true);

    // Act & Assert: Test admin dashboard cards
    await expect(adminDashboardPage.isStatsCardVisible()).resolves.toBe(true);
    await expect(adminDashboardPage.isPlayersCardVisible()).resolves.toBe(true);
    await expect(adminDashboardPage.isScheduleCardVisible()).resolves.toBe(true);
    await expect(adminDashboardPage.isPaymentsCardVisible()).resolves.toBe(true);

    // Act & Assert: Test email banner visibility
    await expect(adminDashboardPage.isEmailBannerVisible()).resolves.toBe(true);

    // Act & Assert: Test admin sessions access
    await adminSessionsPage.goto();
    await helpers.waitForNavigation(testData.urls.adminSessions);
    await expect(adminSessionsPage.isPageVisible()).resolves.toBe(true);

    // Act & Assert: Test header functionality
    await expect(headerPage.isRoleBadgeVisible()).resolves.toBe(true);
    const roleText = await headerPage.getRoleBadgeText();
    expect(roleText).toContain(testData.users.admin.role);

    // Act & Assert: Test user menu
    await headerPage.openUserMenu();
    await expect(headerPage.isProfileMenuItemVisible()).resolves.toBe(true);
    await headerPage.clickProfile();
    await helpers.waitForNavigation(testData.urls.account);
  });

  test('Authentication and Authorization Flow', async ({ page }) => {
    // Test unauthenticated access
    await adminSessionsPage.goto();
    await helpers.waitForNavigation(testData.urls.auth, testData.timeouts.medium);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.auth}`);

    // Test parent trying to access admin area
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);
    await adminSessionsPage.goto();
    await helpers.waitForNavigation(testData.urls.parentDashboard, testData.timeouts.medium);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.parentDashboard}`);

    // Test admin accessing admin area
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);
    await adminSessionsPage.goto();
    await helpers.waitForNavigation(testData.urls.adminSessions);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.adminSessions}`);
  });

  test('Navigation and User Experience', async ({ page }) => {
    // Test parent navigation
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);

    // Test View Full Calendar button
    await expect(parentDashboardPage.isViewFullCalendarButtonVisible()).resolves.toBe(true);
    await parentDashboardPage.clickViewFullCalendar();
    await helpers.waitForNavigation(testData.urls.schedule);

    // Test Add Player button
    await parentDashboardPage.goto();
    await helpers.waitForNavigation(testData.urls.parentDashboard);
    await parentDashboardPage.clickPlayerTab();
    await expect(parentDashboardPage.isAddPlayerButtonVisible()).resolves.toBe(true);
    await parentDashboardPage.clickAddPlayer();
    await helpers.waitForNavigation(testData.urls.playersAdd);

    // Test admin navigation
    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);

    // Test admin dashboard links
    await expect(adminDashboardPage.isManageCoachesButtonVisible()).resolves.toBe(true);
    await expect(adminDashboardPage.isManageUsersButtonVisible()).resolves.toBe(true);
    await expect(adminDashboardPage.isManageSessionsButtonVisible()).resolves.toBe(true);
  });

  test('Data-Driven Test Validation', async ({ page }) => {
    // Verify test data is being used correctly
    expect(testData.users.parent.email).toBe('parent@test.com');
    expect(testData.users.admin.email).toBe('admin@test.com');
    expect(testData.users.parent.role).toBe('parent');
    expect(testData.users.admin.role).toBe('admin');

    // Test login with data-driven credentials
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.parentDashboard}`);

    await helpers.loginAs('admin');
    await helpers.waitForNavigation(testData.urls.admin);
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.admin}`);
  });
});
