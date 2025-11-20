/**
 * Parent Journey Test Fixtures
 * 
 * Provides clean test contexts and authenticated parent sessions
 * without relying on admin storage state.
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

type ParentUser = {
  email: string;
  password: string;
  name: string;
  childName?: string;
};

type ParentFixtures = {
  cleanContext: BrowserContext;
  cleanPage: Page;
  registeredParent: ParentUser;
  parentPage: Page;
  parentContext: BrowserContext;
};

/**
 * Extended test with parent-specific fixtures
 */
export const test = base.extend<ParentFixtures>({
  /**
   * Clean context with no storage state (no admin session)
   */
  cleanContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] }
    });
    await use(context);
    await context.close();
  },

  /**
   * Clean page with no storage state
   */
  cleanPage: async ({ cleanContext }, use) => {
    const page = await cleanContext.newPage();
    await use(page);
    await page.close();
  },

  /**
   * Registered parent user (creates via API)
   */
  registeredParent: async ({ request }, use) => {
    const timestamp = Date.now();
    const parent: ParentUser = {
      email: `parent.test.${timestamp}@example.com`,
      password: 'TestPass123!',
      name: 'Test Parent',
      childName: 'Test Kid'
    };

    // Clear mailbox
    await request.post('/api/_mailbox/clear').catch(() => {});

    // Register parent via API
    const registerResponse = await request.post('/api/registration', {
      data: {
        parentName: parent.name,
        email: parent.email,
        password: parent.password,
        phone: '555-123-4567',
        childName: parent.childName,
        ageGroup: 'U11',
        role: 'parent'
      }
    });

    if (!registerResponse.ok()) {
      const errorText = await registerResponse.text();
      throw new Error(`Registration failed: ${errorText}`);
    }

    console.log(`✅ Registered parent: ${parent.email}`);

    await use(parent);
  },

  /**
   * Authenticated parent context (logged in)
   */
  parentContext: async ({ browser, registeredParent }, use) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] }
    });
    
    const page = await context.newPage();

    // Login via UI
    await page.goto('/login');
    await page.getByTestId('input-email').fill(registeredParent.email);
    await page.getByTestId('input-password').fill(registeredParent.password);
    await page.getByTestId('btn-login').click();
    await page.waitForLoadState('networkidle');

    // Verify login succeeded
    const whoamiResponse = await page.evaluate(async () => {
      const res = await fetch('/api/_whoami', { credentials: 'include' });
      return res.json();
    });

    if (!whoamiResponse.user || whoamiResponse.user.role !== 'parent') {
      throw new Error(`Login failed or user is not a parent: ${JSON.stringify(whoamiResponse)}`);
    }

    console.log(`✅ Parent logged in: ${registeredParent.email}, role: ${whoamiResponse.user.role}`);

    await page.close();
    await use(context);
    await context.close();
  },

  /**
   * Page with authenticated parent session
   */
  parentPage: async ({ parentContext }, use) => {
    const page = await parentContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect };
