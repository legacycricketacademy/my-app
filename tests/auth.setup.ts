import { test } from '@playwright/test';

const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'password'; // Use seeded password from db/seed-pg.ts

test('bootstrap auth and save storage state', async ({ page }) => {
  console.log('🔵 Starting auth setup with:', email);
  
  // Use dev login API directly instead of UI form
  console.log('📍 Using dev login API directly');
  
  // Navigate to auth page first to establish session
  await page.goto('/auth', { waitUntil: 'load', timeout: 30000 });
  console.log('✅ On auth page');
  
  // Use dev login API directly
  const response = await page.request.post('/api/dev/login', {
    data: { email },
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Dev login failed: ${response.status()} ${errorText}`);
  }
  
  const loginResult = await response.json();
  console.log('✅ Dev login successful:', loginResult);
  
  // Verify we're authenticated by checking /api/user
  const userResponse = await page.request.get('/api/user');
  if (!userResponse.ok()) {
    throw new Error(`User verification failed: ${userResponse.status()}`);
  }
  
  const userData = await userResponse.json();
  console.log('✅ User verified:', userData);
  
  // Wait a moment for session to be fully established
  await page.waitForTimeout(1000);
  
  // Save the storage state for other tests
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  console.log('✅ Storage state saved');
});