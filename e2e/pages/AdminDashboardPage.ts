import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import testData from '../utils/testData';

export class AdminDashboardPage extends BasePage {
  private dashboardTitle: Locator;
  private statsCard: Locator;
  private playersCard: Locator;
  private scheduleCard: Locator;
  private paymentsCard: Locator;
  private manageCoachesButton: Locator;
  private manageUsersButton: Locator;
  private manageSessionsButton: Locator;
  private managePaymentsButton: Locator;
  private viewReportsButton: Locator;
  private systemSettingsButton: Locator;
  private emailBanner: Locator;
  private emailBannerDismiss: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardTitle = page.locator(`[data-testid="${testData.testIds.dashboard.title}"]`);
    this.statsCard = page.locator(`[data-testid="${testData.testIds.dashboard.stats}"]`);
    this.playersCard = page.locator(`[data-testid="${testData.testIds.dashboard.players}"]`);
    this.scheduleCard = page.locator(`[data-testid="${testData.testIds.dashboard.schedule}"]`);
    this.paymentsCard = page.locator(`[data-testid="${testData.testIds.dashboard.payments}"]`);
    this.manageCoachesButton = page.locator('text=Manage Coaches');
    this.manageUsersButton = page.locator('text=Manage Users');
    this.manageSessionsButton = page.locator('text=Manage Sessions');
    this.managePaymentsButton = page.locator('text=Manage Payments');
    this.viewReportsButton = page.locator('text=View Reports');
    this.systemSettingsButton = page.locator('text=System Settings');
    this.emailBanner = page.locator('text=Email Service Disabled');
    this.emailBannerDismiss = page.locator('[data-testid="email-banner-dismiss"]');
  }

  async goto() {
    await super.goto(testData.urls.admin);
  }

  async clickManageCoaches() {
    await this.manageCoachesButton.click();
  }

  async clickManageUsers() {
    await this.manageUsersButton.click();
  }

  async clickManageSessions() {
    await this.manageSessionsButton.click();
  }

  async clickManagePayments() {
    await this.managePaymentsButton.click();
  }

  async clickViewReports() {
    await this.viewReportsButton.click();
  }

  async clickSystemSettings() {
    await this.systemSettingsButton.click();
  }

  async dismissEmailBanner() {
    if (await this.emailBannerDismiss.isVisible()) {
      await this.emailBannerDismiss.click();
    }
  }

  async isDashboardTitleVisible() {
    return await this.dashboardTitle.isVisible();
  }

  async getDashboardTitleText() {
    return await this.dashboardTitle.textContent();
  }

  async isStatsCardVisible() {
    return await this.statsCard.isVisible();
  }

  async isPlayersCardVisible() {
    return await this.playersCard.isVisible();
  }

  async isScheduleCardVisible() {
    return await this.scheduleCard.isVisible();
  }

  async isPaymentsCardVisible() {
    return await this.paymentsCard.isVisible();
  }

  async isEmailBannerVisible() {
    return await this.emailBanner.isVisible();
  }

  async getEmailBannerText() {
    return await this.emailBanner.textContent();
  }

  async navigateToCoaches() {
    await this.clickManageCoaches();
  }

  async navigateToUsers() {
    await this.clickManageUsers();
  }

  async navigateToSessions() {
    await this.clickManageSessions();
  }

  async navigateToPayments() {
    await this.clickManagePayments();
  }

  async navigateToReports() {
    await this.clickViewReports();
  }

  async navigateToSettings() {
    await this.clickSystemSettings();
  }
}
