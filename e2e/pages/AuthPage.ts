import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import testData from '../utils/testData';

export class AuthPage extends BasePage {
  private emailInput: Locator;
  private passwordInput: Locator;
  private signInButton: Locator;
  private signInTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.signInButton = page.locator('button[type="submit"]');
    this.signInTitle = page.locator('text=Sign in to your account');
  }

  async goto() {
    await super.goto(testData.urls.auth);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async loginAsParent() {
    const user = testData.users.parent;
    await this.login(user.email, user.password);
  }

  async loginAsAdmin() {
    const user = testData.users.admin;
    await this.login(user.email, user.password);
  }

  async isSignInTitleVisible() {
    return await this.signInTitle.isVisible();
  }

  async getSignInTitleText() {
    return await this.signInTitle.textContent();
  }

  async clearForm() {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }
}
