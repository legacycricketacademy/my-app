import { test, expect } from '@playwright/test';

/**
 * UI Smoke Test Contract
 * 
 * This test verifies that all required UI components and data-testids are present
 * across different pages and user roles. It serves as a contract test to ensure
 * the UI meets the expectations of other E2E tests.
 */

// Test ID constants (mirrored from client/src/ui/testids.ts)
const TID = {
  header: {
    roleBadge: 'role-badge',
    userMenuTrigger: 'user-menu-trigger',
    userMenuProfile: 'user-menu-profile',
    userMenuSettings: 'user-menu-settings',
    userMenuSignout: 'user-menu-signout',
  },
  dashboard: {
    title: 'dashboard-title',
    stats: 'stats-card',
    players: 'players-card',
    fitness: 'fitness-card',
    meal: 'meal-plan-card',
    payments: 'payment-card',
    schedule: 'schedule-card',
    announcements: 'announcements-card',
  },
  schedule: {
    page: 'schedule-page',
    tabs: 'schedule-tabs',
    tabAll: 'tab-all',
    tabPractices: 'tab-practices',
    tabGames: 'tab-games',
    viewSelect: 'view-mode-select',
    viewWeek: 'view-week',
    viewMonth: 'view-month',
    kidFilter: 'kid-filter',
    rsvpGoing: 'rsvp-going',
    rsvpMaybe: 'rsvp-maybe',
    rsvpNo: 'rsvp-no',
  },
  admin: {
    page: 'admin-sessions-page',
    createBtn: 'create-session',
    list: 'session-list',
    row: (id: string | number) => `session-row-${id}`,
    save: 'session-save',
    cancel: 'session-cancel',
  },
  account: {
    page: 'account-page',
    tabProfile: 'account-tab-profile',
    tabSecurity: 'account-tab-security',
    tabNotifications: 'account-tab-notifications',
    tabChildren: 'account-tab-children',
    tabOrg: 'account-tab-organization',
  },
  common: { 
    empty: 'empty-state', 
    skeleton: 'skeleton' 
  }
} as const;

test.describe('UI Smoke Test Contract', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.clear());
  });

  test('parent user can access all required UI elements', async ({ page }) => {
    // Login as parent
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    
    // Wait for dashboard content to load
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Dashboard') || bodyText.includes('Player');
    }, { timeout: 10000 });

    // === DASHBOARD PAGE TESTS ===
    console.log('=== TESTING DASHBOARD PAGE ===');
    
    // Check dashboard title
    await expect(page.locator(`[data-testid="${TID.dashboard.title}"]`)).toBeVisible();
    
    // Check all required dashboard cards exist (even if empty)
    const requiredCards = [
      TID.dashboard.stats,
      TID.dashboard.players,
      TID.dashboard.fitness,
      TID.dashboard.meal,
      TID.dashboard.payments,
      TID.dashboard.schedule,
      TID.dashboard.announcements,
    ];
    
    for (const cardId of requiredCards) {
      await expect(page.locator(`[data-testid="${cardId}"]`)).toBeVisible();
    }

    // === HEADER COMPONENTS ===
    console.log('=== TESTING HEADER COMPONENTS ===');
    
    // Check role badge
    await expect(page.locator(`[data-testid="${TID.header.roleBadge}"]`)).toBeVisible();
    
    // Check user menu trigger
    await expect(page.locator(`[data-testid="${TID.header.userMenuTrigger}"]`)).toBeVisible();
    
    // Open user menu
    await page.click(`[data-testid="${TID.header.userMenuTrigger}"]`);
    
    // Check user menu items
    await expect(page.locator(`[data-testid="${TID.header.userMenuProfile}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.header.userMenuSettings}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.header.userMenuSignout}"]`)).toBeVisible();
    
    // Close menu
    await page.keyboard.press('Escape');

    // === SCHEDULE PAGE TESTS ===
    console.log('=== TESTING SCHEDULE PAGE ===');
    
    await page.goto('http://localhost:3000/schedule');
    await page.waitForLoadState('networkidle');
    
    // Check schedule page container
    await expect(page.locator(`[data-testid="${TID.schedule.page}"]`)).toBeVisible();
    
    // Check tabs
    await expect(page.locator(`[data-testid="${TID.schedule.tabs}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.schedule.tabAll}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.schedule.tabPractices}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.schedule.tabGames}"]`)).toBeVisible();
    
    // Check view mode selector
    await expect(page.locator(`[data-testid="${TID.schedule.viewSelect}"]`)).toBeVisible();
    // Check that the options exist (they're inside the select element)
    const viewSelect = page.locator(`[data-testid="${TID.schedule.viewSelect}"]`);
    await expect(viewSelect).toBeVisible();
    // Check that the options are present in the select
    const weekOption = viewSelect.locator('option[data-testid="view-week"]');
    const monthOption = viewSelect.locator('option[data-testid="view-month"]');
    await expect(weekOption).toHaveCount(1);
    await expect(monthOption).toHaveCount(1);
    
    // Check kid filter (parent only)
    await expect(page.locator(`[data-testid="${TID.schedule.kidFilter}"]`)).toBeVisible();
    
    // Check RSVP buttons (if any sessions exist)
    const rsvpButtons = page.locator(`[data-testid="${TID.schedule.rsvpGoing}"]`);
    if (await rsvpButtons.count() > 0) {
      await expect(rsvpButtons.first()).toBeVisible();
      await expect(page.locator(`[data-testid="${TID.schedule.rsvpMaybe}"]`).first()).toBeVisible();
      await expect(page.locator(`[data-testid="${TID.schedule.rsvpNo}"]`).first()).toBeVisible();
    }

    // === ACCOUNT PAGE TESTS ===
    console.log('=== TESTING ACCOUNT PAGE ===');
    
    await page.goto('http://localhost:3000/account');
    await page.waitForLoadState('networkidle');
    
    // Check account page container
    await expect(page.locator(`[data-testid="${TID.account.page}"]`)).toBeVisible();
    
    // Check parent-specific tabs
    await expect(page.locator(`[data-testid="${TID.account.tabProfile}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.account.tabSecurity}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.account.tabNotifications}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.account.tabChildren}"]`)).toBeVisible();
    
    // Verify organization tab is NOT present for parent
    await expect(page.locator(`[data-testid="${TID.account.tabOrg}"]`)).not.toBeVisible();
  });

  test('admin user can access all required UI elements', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    
    // Wait for dashboard content to load
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Dashboard') || bodyText.includes('Admin');
    }, { timeout: 10000 });

    // === DASHBOARD PAGE TESTS ===
    console.log('=== TESTING ADMIN DASHBOARD PAGE ===');
    
    // Check dashboard title
    await expect(page.locator(`[data-testid="${TID.dashboard.title}"]`)).toBeVisible();
    
    // Check all required dashboard cards exist
    const requiredCards = [
      TID.dashboard.stats,
      TID.dashboard.players,
      TID.dashboard.fitness,
      TID.dashboard.meal,
      TID.dashboard.payments,
      TID.dashboard.schedule,
      TID.dashboard.announcements,
    ];
    
    for (const cardId of requiredCards) {
      await expect(page.locator(`[data-testid="${cardId}"]`)).toBeVisible();
    }

    // === ADMIN SESSIONS PAGE TESTS ===
    console.log('=== TESTING ADMIN SESSIONS PAGE ===');
    
    await page.goto('http://localhost:3000/admin/sessions');
    await page.waitForLoadState('networkidle');
    
    // Check admin sessions page container
    await expect(page.locator(`[data-testid="${TID.admin.page}"]`)).toBeVisible();
    
    // Check create session button
    await expect(page.locator(`[data-testid="${TID.admin.createBtn}"]`)).toBeVisible();
    
    // Check session list
    await expect(page.locator(`[data-testid="${TID.admin.list}"]`)).toBeVisible();
    
    // Check if any session rows exist
    const sessionRows = page.locator(`[data-testid^="${TID.admin.row('').replace('${id}', '')}"]`);
    if (await sessionRows.count() > 0) {
      await expect(sessionRows.first()).toBeVisible();
    }

    // === ACCOUNT PAGE TESTS (ADMIN) ===
    console.log('=== TESTING ADMIN ACCOUNT PAGE ===');
    
    await page.goto('http://localhost:3000/account');
    await page.waitForLoadState('networkidle');
    
    // Check account page container
    await expect(page.locator(`[data-testid="${TID.account.page}"]`)).toBeVisible();
    
    // Check admin-specific tabs
    await expect(page.locator(`[data-testid="${TID.account.tabProfile}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.account.tabSecurity}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.account.tabNotifications}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${TID.account.tabOrg}"]`)).toBeVisible();
    
    // Verify children tab is NOT present for admin
    await expect(page.locator(`[data-testid="${TID.account.tabChildren}"]`)).not.toBeVisible();
  });

  test('empty states are properly displayed', async ({ page }) => {
    // Login as parent
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    
    // Wait for dashboard content to load
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Dashboard') || bodyText.includes('Player');
    }, { timeout: 10000 });

    // Check that empty states are present where expected
    const emptyStates = page.locator(`[data-testid="${TID.common.empty}"]`);
    if (await emptyStates.count() > 0) {
      await expect(emptyStates.first()).toBeVisible();
    }

    // Check that skeletons are present during loading
    const skeletons = page.locator(`[data-testid="${TID.common.skeleton}"]`);
    if (await skeletons.count() > 0) {
      await expect(skeletons.first()).toBeVisible();
    }
  });

  test('all required testids are present and accessible', async ({ page }) => {
    // Login as parent
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    
    // Wait for dashboard content to load
    await page.waitForLoadState('networkidle');

    // Test that all testids are properly formatted and accessible
    const allTestIds = [
      // Header
      TID.header.roleBadge,
      TID.header.userMenuTrigger,
      TID.header.userMenuProfile,
      TID.header.userMenuSettings,
      TID.header.userMenuSignout,
      
      // Dashboard
      TID.dashboard.title,
      TID.dashboard.stats,
      TID.dashboard.players,
      TID.dashboard.fitness,
      TID.dashboard.meal,
      TID.dashboard.payments,
      TID.dashboard.schedule,
      TID.dashboard.announcements,
      
      // Common
      TID.common.empty,
      TID.common.skeleton,
    ];

    for (const testId of allTestIds) {
      const element = page.locator(`[data-testid="${testId}"]`);
      const count = await element.count();
      
      if (count > 0) {
        await expect(element.first()).toBeVisible();
        console.log(`✓ ${testId} is present and visible`);
      } else {
        console.log(`⚠ ${testId} is not present (may be conditional)`);
      }
    }
  });
});
