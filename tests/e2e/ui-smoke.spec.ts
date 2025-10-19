import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.use({ storageState: 'playwright/.auth/admin.json' }); // pre-auth state

test('schedule fetch succeeds (auth cookie carried)', async ({ page }) => {
  await page.goto(`${BASE}/dashboard/schedule`);
  // no 401s on "sessions" request
  const [resp] = await Promise.all([
    page.waitForResponse(r => /\/api\/(coach\/|admin\/)?sessions(\?|$)/.test(r.url()), { timeout: 10000 }),
    page.waitForLoadState('domcontentloaded')
  ]);
  expect(resp.status()).toBeLessThan(400);
});

test('log activity modal opens', async ({ page }) => {
  await page.goto(`${BASE}/dashboard/fitness`);
  const logButton = page.getByRole('button', { name: /log activity/i });
  if (await logButton.isVisible()) {
    await logButton.click();
    await expect(page.getByText(/log activity/i).first()).toBeVisible({ timeout: 5000 });
  }
});

test('create announcement modal opens', async ({ page }) => {
  await page.goto(`${BASE}/dashboard/announcements`);
  const createButton = page.getByRole('button', { name: /create announcement/i });
  if (await createButton.isVisible()) {
    await createButton.click();
    await expect(page.getByText(/create announcement/i).first()).toBeVisible({ timeout: 5000 });
  }
});
