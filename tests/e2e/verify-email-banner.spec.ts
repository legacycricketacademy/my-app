// tests/e2e/verify-email-banner.spec.ts
import { test, expect } from '@playwright/test';

// This test assumes your seeded test user has email_verified=false in Keycloak
// Mark as skip if you don't have such a user configured
test.skip('shows banner and can attempt resend', async ({ page }) => {
  const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
  const email = process.env.PARENT_EMAIL_UNVERIFIED ?? 'unverified@test.com';
  const password = process.env.PARENT_PASSWORD ?? 'Test1234!';
  
  await page.goto(`${BASE}/auth`);
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for dashboard to load
  await page.waitForURL(/dashboard|parent/, { timeout: 10000 });

  // Banner should be visible
  await expect(page.getByText(/Please verify your email/i)).toBeVisible({ timeout: 5000 });
  
  // Click resend button
  await page.getByRole('button', { name: /Resend verification email/i }).click();
  
  // Should show feedback message
  await expect(
    page.getByText(/Verification email sent|Could not resend|Request failed/i)
  ).toBeVisible({ timeout: 5000 });
  
  // Dismiss button should work
  const dismissButton = page.getByRole('button', { name: /dismiss/i });
  if (await dismissButton.isVisible()) {
    await dismissButton.click();
    await expect(page.getByText(/Please verify your email/i)).not.toBeVisible();
  }
});
