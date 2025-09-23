import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import testData from '../utils/testData';

export class AdminSessionsPage extends BasePage {
  private pageTitle: Locator;
  private adminSessionsPage: Locator;
  private createSessionButton: Locator;
  private sessionList: Locator;
  private sessionRow: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1');
    this.adminSessionsPage = page.locator(`[data-testid="${testData.testIds.admin.page}"]`);
    this.createSessionButton = page.locator(`[data-testid="${testData.testIds.admin.createBtn}"]`);
    this.sessionList = page.locator(`[data-testid="${testData.testIds.admin.list}"]`);
    this.sessionRow = page.locator(`[data-testid^="${testData.testIds.admin.rowPrefix}"]`);
  }

  async goto() {
    await super.goto(testData.urls.adminSessions);
  }

  async clickCreateSession() {
    await this.createSessionButton.click();
  }

  async isPageVisible() {
    return await this.adminSessionsPage.isVisible();
  }

  async getPageTitleText() {
    return await this.pageTitle.textContent();
  }

  async isCreateSessionButtonVisible() {
    return await this.createSessionButton.isVisible();
  }

  async isSessionListVisible() {
    return await this.sessionList.isVisible();
  }

  async getSessionCount() {
    return await this.sessionRow.count();
  }

  async getSessionRowById(id: string | number) {
    return this.page.locator(`[data-testid="${testData.testIds.admin.rowPrefix}${id}"]`);
  }

  async isSessionRowVisible(id: string | number) {
    const row = await this.getSessionRowById(id);
    return await row.isVisible();
  }

  async clickSessionRow(id: string | number) {
    const row = await this.getSessionRowById(id);
    await row.click();
  }

  async getSessionRowText(id: string | number) {
    const row = await this.getSessionRowById(id);
    return await row.textContent();
  }
}
