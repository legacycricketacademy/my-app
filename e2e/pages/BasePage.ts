import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;
  protected baseUrl: string;

  constructor(page: Page, baseUrl: string = 'http://localhost:3000') {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async goto(path: string = '') {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle') {
    await this.page.waitForLoadState(state);
  }

  async waitForURL(url: string, timeout?: number) {
    await this.page.waitForURL(url, { timeout });
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  async getCurrentURL() {
    return this.page.url();
  }

  async getTitle() {
    return this.page.title();
  }
}
