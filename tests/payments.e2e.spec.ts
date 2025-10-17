import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Payments E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE}/auth`);
    await page.getByPlaceholder('Enter your email').fill(process.env.ADMIN_EMAIL || 'admin@test.com');
    await page.getByPlaceholder('Enter your password').fill(process.env.ADMIN_PASSWORD || 'Test1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard to load
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should record a payment and display it in the list', async ({ page }) => {
    // Navigate to payments page
    await page.goto(`${BASE}/dashboard/payments`);
    await expect(page.getByText('Payments')).toBeVisible();

    // Click Record Payment button
    await page.getByRole('button', { name: /record payment/i }).click();
    
    // Wait for modal to open
    await expect(page.getByText('Record Payment')).toBeVisible();

    // Fill in payment details
    await page.getByRole('combobox').first().click();
    await page.getByText('John Doe').click();
    
    await page.getByPlaceholder('0.00').fill('150.00');
    
    // Select payment method
    await page.getByRole('combobox').nth(1).click();
    await page.getByText('Cash').click();
    
    // Add reference
    await page.getByPlaceholder('Transaction ID, check number, etc.').fill('TXN123456');
    
    // Add notes
    await page.getByPlaceholder('Additional information about the payment...').fill('Monthly training fee');
    
    // Submit the form
    await page.getByRole('button', { name: /record payment/i }).click();
    
    // Wait for success toast
    await expect(page.getByText('Payment recorded successfully')).toBeVisible();
    
    // Wait for modal to close
    await expect(page.getByText('Record Payment')).not.toBeVisible();
    
    // Verify payment appears in the list
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('₹150.00')).toBeVisible();
    await expect(page.getByText('TXN123456')).toBeVisible();
    await expect(page.getByText('Monthly training fee')).toBeVisible();
  });

  test('should show empty state when no payments exist', async ({ page }) => {
    // Navigate to payments page
    await page.goto(`${BASE}/dashboard/payments`);
    
    // Should see empty state
    await expect(page.getByText('No payments recorded')).toBeVisible();
    await expect(page.getByText('Payment records will appear here once players make payments.')).toBeVisible();
  });

  test('should validate payment form fields', async ({ page }) => {
    // Navigate to payments page
    await page.goto(`${BASE}/dashboard/payments`);
    
    // Click Record Payment button
    await page.getByRole('button', { name: /record payment/i }).click();
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /record payment/i }).click();
    
    // Should see validation errors
    await expect(page.getByText('Player is required')).toBeVisible();
    await expect(page.getByText('Amount must be positive')).toBeVisible();
  });
});
