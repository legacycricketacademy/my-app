import { test, expect } from '@playwright/test';

// These come from environment variables (set in CI via GitHub Secrets)
const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'Test1234!';

test('bootstrap auth and save storage state', async ({ page }) => {
  console.log('🔵 Starting auth setup with:', email);
  
  // Listen for console messages and network requests
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
    }
  });
  
  // Navigate to login page
  await page.goto('/auth', { waitUntil: 'networkidle' });
  console.log('✅ On login page');

  // Use the dev account "Use" button to fill the form
  console.log('Looking for dev account "Use" buttons...');
  const useButtons = page.getByRole('button', { name: /^use$/i });
  const buttonCount = await useButtons.count();
  console.log(`Found ${buttonCount} "Use" buttons`);
  
  if (buttonCount >= 2) {
    // Click the second "Use" button (admin@test.com) to fill the form
    await useButtons.nth(1).click();
    console.log('✅ Clicked "Use" button for admin account');
    await page.waitForTimeout(500);
  } else {
    // If no Use buttons, fill manually
    console.log('⚠️ No "Use" buttons found, filling form manually');
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
  }
  
  // Take screenshot before signing in
  await page.screenshot({ path: 'test-results/before-sign-in.png', fullPage: true });
  
  // Now click the Sign In button
  const signInButton = page.getByRole('button', { name: /sign in/i });
  await signInButton.click();
  console.log('✅ Clicked Sign In button');
  
  // Wait a moment to see what happens
  await page.waitForTimeout(2000);
  
  // Check current URL
  console.log('Current URL after click:', page.url());
  
  // Take screenshot after clicking
  await page.screenshot({ path: 'test-results/after-sign-in.png', fullPage: true });
  
  // Check for any obvious error messages
  const errorMessage = page.locator('[role="alert"], .error, .alert-error').first();
  if (await errorMessage.isVisible().catch(() => false)) {
    const errorText = await errorMessage.textContent();
    console.log('⚠️ Error message visible:', errorText);
  }

  // Wait for the API responses to complete
  await page.waitForTimeout(3000);
  
  console.log('✅ Login request completed');
  console.log('Final URL:', page.url());
  
  // Check if there are any cookies
  const cookies = await page.context().cookies();
  console.log('Cookies count:', cookies.length);
  const sessionCookie = cookies.find(c => c.name === 'sid' || c.name === 'connect.sid');
  if (sessionCookie) {
    console.log('✅ Found session cookie:', sessionCookie.name);
  } else {
    console.log('⚠️ No session cookie found');
    console.log('All cookies:', cookies.map(c => c.name).join(', '));
  }
  
  // Save storage state regardless of navigation
  console.log('✅ Saving storage state');
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  console.log('✅ Auth setup complete!');
});
