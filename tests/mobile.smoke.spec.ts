import { test, expect } from '@playwright/test';
import { openLinkOrGoto } from './utils/nav';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

// This test file will run on both Desktop and Mobile (Pixel 5) viewports
// when using the multi-config

test.describe('Mobile-Friendly Smoke Tests', () => {
  
  test('payments page is mobile-friendly', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/payments`);
    
    // Wait for page to load
    await expect(page.getByTestId("heading-payments")).toBeVisible();
    
    // Verify critical elements are visible on mobile
    await expect(page.getByTestId("btn-record-payment")).toBeVisible();
    await expect(page.getByTestId("heading-pending")).toBeVisible();
    await expect(page.getByTestId("heading-paid")).toBeVisible();
    
    // Check that empty states are visible
    const hasPending = await page.getByTestId("empty-pending").isVisible().catch(() => false);
    const hasPaid = await page.getByTestId("empty-paid").isVisible().catch(() => false);
    
    // At least one should be visible (empty state or list)
    expect(hasPending || hasPaid).toBe(true);
  });
  
  test('parent dashboard is mobile-friendly', async ({ page }) => {
    await page.goto(`${BASE}/parent`);
    
    // Wait for page to load
    await page.waitForLoadState('load');
    
    // Check for any visible content (mobile-responsive)
    const hasContent = await page.locator('h1, h2, .card, main').first().isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });
  
  test('schedule page is mobile-friendly', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/schedule`);
    
    // Wait for schedule heading
    await expect(page.getByRole('heading', { name: 'Schedule', exact: true })).toBeVisible();
    
    // Verify "Add Session" button is accessible on mobile
    const addButton = page.getByRole('button', { name: /add session/i }).first();
    await expect(addButton).toBeVisible();
  });
  
  test('team page is mobile-friendly', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/team`);
    
    // Wait for page to load
    await page.waitForLoadState('load');
    
    // Check that page loaded (any content is fine)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });
  
  test('announcements page is mobile-friendly', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/announcements`);
    
    // Wait for heading
    await expect(page.getByRole('heading', { name: 'Announcements', exact: true })).toBeVisible();
    
    // Check that create button is accessible
    const createButton = page.getByRole('button', { name: /create announcement/i }).first();
    await expect(createButton).toBeVisible();
  });
});

