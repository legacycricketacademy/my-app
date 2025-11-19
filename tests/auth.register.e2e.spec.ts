import { test, expect } from '@playwright/test';

test.describe('Registration CTA and Page', () => {
  test('should show parent registration CTA on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for the registration CTA button
    const registerButton = page.getByTestId('btn-new-parent-register');
    await expect(registerButton).toBeVisible();
    await expect(registerButton).toContainText('Register as Parent');
  });

  test('should navigate to registration page when clicking register button', async ({ page }) => {
    await page.goto('/login');
    
    // Click the "New parent? Register" button
    await page.getByTestId('btn-new-parent-register').click();
    
    // Should navigate to /register
    await expect(page).toHaveURL(/\/register/);
    
    // Should show registration heading
    await expect(page.getByTestId('heading-register')).toBeVisible();
  });

  test('should show all required registration fields', async ({ page }) => {
    await page.goto('/register');
    
    // Check all required fields are present
    await expect(page.getByTestId('reg-parent-name')).toBeVisible();
    await expect(page.getByTestId('reg-email')).toBeVisible();
    await expect(page.getByTestId('reg-password')).toBeVisible();
    await expect(page.getByTestId('reg-confirm-password')).toBeVisible();
    await expect(page.getByTestId('reg-submit')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit without filling fields
    await page.getByTestId('reg-submit').click();
    
    // HTML5 validation should prevent submission
    // Check that we're still on the register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('should validate password match', async ({ page }) => {
    await page.goto('/register');
    
    // Fill in fields with mismatched passwords
    await page.getByTestId('reg-parent-name').fill('Test Parent');
    await page.getByTestId('reg-email').fill('test@example.com');
    await page.getByTestId('reg-password').fill('password123');
    await page.getByTestId('reg-confirm-password').fill('password456');
    
    // Submit form
    await page.getByTestId('reg-submit').click();
    
    // Should show error message about password mismatch
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    
    // Fill in fields with invalid email
    await page.getByTestId('reg-parent-name').fill('Test Parent');
    await page.getByTestId('reg-email').fill('invalid-email');
    await page.getByTestId('reg-password').fill('password123');
    await page.getByTestId('reg-confirm-password').fill('password123');
    
    // Submit form
    await page.getByTestId('reg-submit').click();
    
    // Should show error or stay on page (HTML5 validation)
    await expect(page).toHaveURL(/\/register/);
  });

  test('should have link back to login page', async ({ page }) => {
    await page.goto('/register');
    
    // Check for "Sign in here" link
    const loginLink = page.getByTestId('link-login');
    await expect(loginLink).toBeVisible();
    
    // Click it and verify navigation
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
