import { test } from '@playwright/test';

const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'password'; // Use seeded password from db/seed-pg.ts

test('bootstrap auth and save storage state', async ({ page }) => {
  console.log('🔵 Starting auth setup with:', email);
  
  // Use dev login API directly instead of UI form
  console.log('📍 Using dev login API directly');
  
  // Navigate to auth page first to establish session (increased timeout for Render cold start)
  await page.goto('/auth', { waitUntil: 'load', timeout: 60000 });
  console.log('✅ On auth page');
  
  // Use dev login API directly with retry logic for Render cold starts
  let response;
  let lastError;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Login attempt ${attempt}/${maxRetries}...`);
      response = await page.request.post('/api/dev/login', {
        data: { email },
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60 seconds for Render cold start
      });
      
      if (response.ok()) {
        break; // Success!
      }
      
      const errorText = await response.text();
      lastError = `Status ${response.status()}: ${errorText}`;
      console.log(`⚠️ Attempt ${attempt} failed: ${lastError}`);
      
      if (attempt < maxRetries) {
        console.log('⏳ Waiting 10 seconds before retry...');
        await page.waitForTimeout(10000);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.log(`⚠️ Attempt ${attempt} threw error: ${lastError}`);
      
      if (attempt < maxRetries) {
        console.log('⏳ Waiting 10 seconds before retry...');
        await page.waitForTimeout(10000);
      }
    }
  }
  
  if (!response || !response.ok()) {
    throw new Error(`Dev login failed after ${maxRetries} attempts. Last error: ${lastError}`);
  }
  
  const loginResult = await response.json();
  console.log('✅ Dev login successful:', loginResult);
  
  // Verify we're authenticated by checking /api/user
  const userResponse = await page.request.get('/api/user', { timeout: 30000 });
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