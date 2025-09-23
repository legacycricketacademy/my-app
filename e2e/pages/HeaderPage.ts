import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import testData from '../utils/testData';

export class HeaderPage extends BasePage {
  private roleBadge: Locator;
  private userMenuTrigger: Locator;
  private userMenuProfile: Locator;
  private userMenuSettings: Locator;
  private userMenuSignout: Locator;

  constructor(page: Page) {
    super(page);
    this.roleBadge = page.locator(`[data-testid="${testData.testIds.header.roleBadge}"]`);
    this.userMenuTrigger = page.locator(`[data-testid="${testData.testIds.header.userMenuTrigger}"]`);
    this.userMenuProfile = page.locator(`[data-testid="${testData.testIds.header.userMenuProfile}"]`);
    this.userMenuSettings = page.locator(`[data-testid="${testData.testIds.header.userMenuSettings}"]`);
    this.userMenuSignout = page.locator(`[data-testid="${testData.testIds.header.userMenuSignout}"]`);
  }

  async openUserMenu() {
    await this.userMenuTrigger.click();
  }

  async clickProfile() {
    await this.userMenuProfile.click();
  }

  async clickSettings() {
    await this.userMenuSettings.click();
  }

  async clickSignOut() {
    await this.userMenuSignout.click();
  }

  async isRoleBadgeVisible() {
    return await this.roleBadge.isVisible();
  }

  async getRoleBadgeText() {
    return await this.roleBadge.textContent();
  }

  async isUserMenuVisible() {
    return await this.userMenuTrigger.isVisible();
  }

  async isProfileMenuItemVisible() {
    return await this.userMenuProfile.isVisible();
  }

  async isSettingsMenuItemVisible() {
    return await this.userMenuSettings.isVisible();
  }

  async isSignOutMenuItemVisible() {
    return await this.userMenuSignout.isVisible();
  }

  async navigateToAccount() {
    await this.openUserMenu();
    await this.clickProfile();
  }

  async signOut() {
    await this.openUserMenu();
    await this.clickSignOut();
  }
}
