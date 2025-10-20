import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'Test1234!';

test('bootstrap auth and save storage state', async ({ page }) => {
  console.log('🔵 Starting auth setup with:', email);
  
  // Navigate to login page
  await page.goto('/auth', { waitUntil: 'networkidle' });
  console.log('✅ On login page');

  // Check for dev "Use" button that fills credentials
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
  
  // Now click the Sign In button to actually submit
  const signInButton = page.getByRole('button', { name: /sign in/i });
  await signInButton.click();
  console.log('✅ Clicked Sign In button');
  
  // Wait for navigation away from /auth to any dashboard route
  try {
    await page.waitForURL(/\/(dashboard|admin|parent|coach)(\/.*)?$/i, { timeout: 15000 });
    console.log('✅ Navigated to dashboard URL:', page.url());
  } catch (e) {
    // Fallback: wait for any non-auth URL
    await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15000 });
    console.log('✅ Navigated away from /auth to:', page.url());
  }
  
  // Wait for page to load (use domcontentloaded instead of networkidle to avoid hanging)
  await page.waitForLoadState('domcontentloaded');
  
  // Give it a moment for any async requests
  await page.waitForTimeout(1000);
  
  // Check if there are any cookies
  const cookies = await page.context().cookies();
  console.log('Cookies count:', cookies.length);
  const sessionCookie = cookies.find(c => c.name === 'connect.sid' || c.name === 'sid');
  if (sessionCookie) {
    console.log('✅ Found session cookie:', sessionCookie.name);
  } else {
    console.log('⚠️ No session cookie found');
    console.log('All cookies:', cookies.map(c => c.name).join(', '));
  }
  
  // Save storage state for authenticated tests
  console.log('✅ Saving storage state');
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  console.log('✅ Auth setup complete!');
});
