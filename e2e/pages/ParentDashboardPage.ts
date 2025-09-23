import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import testData from '../utils/testData';

export class ParentDashboardPage extends BasePage {
  private dashboardTitle: Locator;
  private statsCard: Locator;
  private announcementsCard: Locator;
  private scheduleCard: Locator;
  private playersCard: Locator;
  private fitnessCard: Locator;
  private mealPlanCard: Locator;
  private paymentCard: Locator;
  private scheduleTab: Locator;
  private playerTab: Locator;
  private fitnessTab: Locator;
  private locationTab: Locator;
  private paymentsTab: Locator;
  private viewFullCalendarButton: Locator;
  private addPlayerButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardTitle = page.locator(`[data-testid="${testData.testIds.dashboard.title}"]`);
    this.statsCard = page.locator(`[data-testid="${testData.testIds.dashboard.stats}"]`);
    this.announcementsCard = page.locator(`[data-testid="${testData.testIds.dashboard.announcements}"]`);
    this.scheduleCard = page.locator(`[data-testid="${testData.testIds.dashboard.schedule}"]`);
    this.playersCard = page.locator(`[data-testid="${testData.testIds.dashboard.players}"]`);
    this.fitnessCard = page.locator(`[data-testid="${testData.testIds.dashboard.fitness}"]`);
    this.mealPlanCard = page.locator(`[data-testid="${testData.testIds.dashboard.meal}"]`);
    this.paymentCard = page.locator(`[data-testid="${testData.testIds.dashboard.payments}"]`);
    this.scheduleTab = page.locator('text=Schedule');
    this.playerTab = page.locator('text=Player Profile');
    this.fitnessTab = page.locator('text=Fitness & Meals');
    this.locationTab = page.locator('text=Locations');
    this.paymentsTab = page.locator('text=Payments');
    this.viewFullCalendarButton = page.locator('button:has-text("View Full Calendar")');
    this.addPlayerButton = page.locator('[data-testid="add-player-btn"]');
  }

  async goto() {
    await super.goto(testData.urls.parentDashboard);
  }

  async clickScheduleTab() {
    await this.scheduleTab.click();
  }

  async clickPlayerTab() {
    await this.playerTab.click();
  }

  async clickFitnessTab() {
    await this.fitnessTab.click();
  }

  async clickLocationTab() {
    await this.locationTab.click();
  }

  async clickPaymentsTab() {
    await this.paymentsTab.click();
  }

  async clickViewFullCalendar() {
    await this.viewFullCalendarButton.click();
  }

  async clickAddPlayer() {
    await this.addPlayerButton.click();
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

  async isAnnouncementsCardVisible() {
    return await this.announcementsCard.isVisible();
  }

  async isScheduleCardVisible() {
    return await this.scheduleCard.isVisible();
  }

  async isPlayersCardVisible() {
    return await this.playersCard.isVisible();
  }

  async isFitnessCardVisible() {
    return await this.fitnessCard.isVisible();
  }

  async isMealPlanCardVisible() {
    return await this.mealPlanCard.isVisible();
  }

  async isPaymentCardVisible() {
    return await this.paymentCard.isVisible();
  }

  async isViewFullCalendarButtonVisible() {
    return await this.viewFullCalendarButton.isVisible();
  }

  async isAddPlayerButtonVisible() {
    return await this.addPlayerButton.isVisible();
  }

  async navigateToSchedule() {
    await this.clickViewFullCalendar();
  }

  async navigateToAddPlayer() {
    await this.clickPlayerTab();
    await this.clickAddPlayer();
  }
}
