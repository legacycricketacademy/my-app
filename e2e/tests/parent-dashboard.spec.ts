import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { ParentDashboardPage } from '../pages/ParentDashboardPage';
import { HeaderPage } from '../pages/HeaderPage';
import { TestHelpers } from '../utils/helpers';
import testData from '../utils/testData';

test.describe('Parent Dashboard UI', () => {
  let authPage: AuthPage;
  let parentDashboardPage: ParentDashboardPage;
  let headerPage: HeaderPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page objects and helpers
    authPage = new AuthPage(page);
    parentDashboardPage = new ParentDashboardPage(page);
    headerPage = new HeaderPage(page);
    helpers = new TestHelpers(page);

    // Act: Login as parent user
    await helpers.loginAs('parent');
    await helpers.waitForNavigation(testData.urls.parentDashboard);
  });

  test('parent user sees enhanced dashboard with all cards and functionality', async ({ page }) => {
    // Arrange: Verify we're on the correct page
    await expect(page).toHaveURL(`${testData.urls.base}${testData.urls.parentDashboard}`);

    // Act & Assert: Check dashboard title
    const dashboardTitle = await parentDashboardPage.getDashboardTitleText();
    expect(dashboardTitle).toContain(testData.expectedTexts.parentDashboard.title);

    // Act & Assert: Check stats cards are visible (always visible)
    await expect(parentDashboardPage.isStatsCardVisible()).resolves.toBe(true);
    await expect(parentDashboardPage.isAnnouncementsCardVisible()).resolves.toBe(true);

    // Act & Assert: Check schedule card is visible (default tab)
    await expect(parentDashboardPage.isScheduleCardVisible()).resolves.toBe(true);

    // Act & Assert: Check other cards by switching tabs
    await parentDashboardPage.clickPlayerTab();
    await expect(parentDashboardPage.isPlayersCardVisible()).resolves.toBe(true);
    await expect(parentDashboardPage.isFitnessCardVisible()).resolves.toBe(true);

    await parentDashboardPage.clickFitnessTab();
    await expect(parentDashboardPage.isMealPlanCardVisible()).resolves.toBe(true);

    await parentDashboardPage.clickPaymentsTab();
    await expect(parentDashboardPage.isPaymentCardVisible()).resolves.toBe(true);

    // Act & Assert: Test Add Player button functionality
    await parentDashboardPage.clickPlayerTab();
    await expect(parentDashboardPage.isAddPlayerButtonVisible()).resolves.toBe(true);
    await parentDashboardPage.clickAddPlayer();
    await helpers.waitForNavigation(testData.urls.playersAdd);

    // Act & Assert: Go back to dashboard and test View Full Calendar button
    await parentDashboardPage.goto();
    await helpers.waitForNavigation(testData.urls.parentDashboard);
    await expect(parentDashboardPage.isViewFullCalendarButtonVisible()).resolves.toBe(true);
    await parentDashboardPage.clickViewFullCalendar();
    await helpers.waitForNavigation(testData.urls.schedule);
  });

  test('parent dashboard displays correct user information', async ({ page }) => {
    // Act & Assert: Check that dashboard shows parent-specific content
    await expect(parentDashboardPage.isDashboardTitleVisible()).resolves.toBe(true);
    
    const titleText = await parentDashboardPage.getDashboardTitleText();
    expect(titleText).toContain(testData.users.parent.name);
  });

  test('parent dashboard tabs work correctly', async ({ page }) => {
    // Act & Assert: Test each tab functionality
    await parentDashboardPage.clickScheduleTab();
    await expect(parentDashboardPage.isScheduleCardVisible()).resolves.toBe(true);

    await parentDashboardPage.clickPlayerTab();
    await expect(parentDashboardPage.isPlayersCardVisible()).resolves.toBe(true);

    await parentDashboardPage.clickFitnessTab();
    await expect(parentDashboardPage.isMealPlanCardVisible()).resolves.toBe(true);

    await parentDashboardPage.clickLocationTab();
    // Location tab content should be visible

    await parentDashboardPage.clickPaymentsTab();
    await expect(parentDashboardPage.isPaymentCardVisible()).resolves.toBe(true);
  });
});
