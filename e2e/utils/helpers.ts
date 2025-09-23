import { Page, expect } from '@playwright/test';
import testData from './testData';

export class TestHelpers {
  constructor(private page: Page) {}

  async loginAs(role: 'parent' | 'admin') {
    const user = testData.users[role];
    
    await this.page.goto(`${testData.urls.base}${testData.urls.auth}`);
    await this.page.waitForLoadState('networkidle');
    await this.page.evaluate(() => localStorage.clear());
    
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  generateRandomEmail(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `test.user.${timestamp}.${random}@example.com`;
  }

  async waitForNavigation(path: string, timeout?: number) {
    const fullUrl = `${testData.urls.base}${path}`;
    await this.page.waitForURL(fullUrl, { timeout: timeout || testData.timeouts.medium });
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  async waitForElement(selector: string, timeout?: number) {
    await this.page.waitForSelector(selector, { timeout: timeout || testData.timeouts.medium });
  }

  async getCurrentURL() {
    return this.page.url();
  }

  async getTextContent(selector: string) {
    return await this.page.textContent(selector);
  }

  async isVisible(selector: string) {
    return await this.page.isVisible(selector);
  }

  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  async hoverElement(selector: string) {
    await this.page.hover(selector);
  }

  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }
}
