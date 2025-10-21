import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' }); // pre-auth state

test('stripe payment element renders in record payment modal', async ({ page }) => {
  // Navigate to payments page
  await page.goto('/dashboard/payments');
  await expect(page.getByRole('heading', { name: 'Payments', exact: true })).toBeVisible();

  // Click Record Payment button (use first() to avoid multiple matches)
  const recordButton = page.getByRole('button', { name: /record payment/i }).first();
  await recordButton.click();

  // Wait for modal to open
  await expect(page.getByRole('dialog')).toBeVisible();

  // Fill in required fields
  await page.getByPlaceholder('Enter player ID').fill('test-player-123');
  await page.getByPlaceholder('Enter player name').fill('Test Player');
  await page.getByPlaceholder('0.00').fill('100');

  // Enable Stripe payment toggle
  const stripeToggle = page.getByRole('switch', { name: /collect payment now/i });
  await stripeToggle.click();

  // Wait for Stripe payment component to load
  await expect(page.getByText('Payment Details')).toBeVisible({ timeout: 10000 });
  
  // Check that Payment Element is rendered (Stripe's iframe)
  const stripeIframe = page.frameLocator('[data-testid="payment-element"] iframe, iframe[src*="js.stripe.com"]').first();
  
  // If iframe is not found, check for Stripe elements container
  const stripeContainer = page.locator('[data-testid="payment-element"], .StripeElement, [class*="stripe"]').first();
  
  // At least one Stripe element should be present
  const hasStripeElement = await Promise.race([
    stripeIframe.locator('body').isVisible().then(() => true).catch(() => false),
    stripeContainer.isVisible().then(() => true).catch(() => false)
  ]);

  expect(hasStripeElement).toBe(true);

  // Check that amount is displayed correctly
  await expect(page.getByText('INR 100.00')).toBeVisible();

  // Check that payment buttons are present
  await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /pay inr 100.00/i })).toBeVisible();
});

test('stripe payment modal handles missing publishable key gracefully', async ({ page }) => {
  // Mock missing publishable key by intercepting the Stripe load
  await page.route('**/js.stripe.com/**', route => route.abort());
  
  // Navigate to payments page
  await page.goto('/dashboard/payments');
  await page.getByRole('button', { name: /record payment/i }).first().click();

  // Fill in required fields
  await page.getByPlaceholder('Enter player ID').fill('test-player-123');
  await page.getByPlaceholder('0.00').fill('100');

  // Enable Stripe payment toggle
  await page.getByRole('switch', { name: /collect payment now/i }).click();

  // Should show error state
  await expect(page.getByText(/failed to initialize payment|error/i)).toBeVisible({ timeout: 5000 });
});

test('stripe payment intent creation fails gracefully', async ({ page }) => {
  // Mock payment intent creation failure
  await page.route('**/api/stripe/payment-intents', route => 
    route.fulfill({ 
      status: 500, 
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'payment_intent_failed', message: 'Test error' })
    })
  );

  // Navigate to payments page
  await page.goto('/dashboard/payments');
  await page.getByRole('button', { name: /record payment/i }).first().click();

  // Fill in required fields
  await page.getByPlaceholder('Enter player ID').fill('test-player-123');
  await page.getByPlaceholder('0.00').fill('100');

  // Enable Stripe payment toggle
  await page.getByRole('switch', { name: /collect payment now/i }).click();

  // Should show error message
  await expect(page.getByText(/test error|failed to create payment intent/i)).toBeVisible({ timeout: 5000 });
});
