import { test } from '@playwright/test';

const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'password'; // Use seeded password from db/seed-pg.ts

test('bootstrap auth and save storage state', async ({ page, request }) => {
  console.log('🔵 Starting auth setup with:', email);
  console.log('📍 Using dev login API directly');
  
  // Call dev login API directly (no page navigation needed first)
  let response;
  let lastError;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Login attempt ${attempt}/${maxRetries}...`);
      response = await request.post('/api/dev/login', {
        data: { email },
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 seconds should be enough for local dev
      });
      
      if (response.ok()) {
        break; // Success!
      }
      
      const errorText = await response.text();
      lastError = `Status ${response.status()}: ${errorText}`;
      console.log(`⚠️ Attempt ${attempt} failed: ${lastError}`);
      
      if (attempt < maxRetries) {
        console.log('⏳ Waiting 2 seconds before retry...');
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.log(`⚠️ Attempt ${attempt} threw error: ${lastError}`);
      
      if (attempt < maxRetries) {
        console.log('⏳ Waiting 2 seconds before retry...');
        await page.waitForTimeout(2000);
      }
    }
  }
  
  if (!response || !response.ok()) {
    throw new Error(`Dev login failed after ${maxRetries} attempts. Last error: ${lastError}`);
  }
  
  const loginResult = await response.json();
  console.log('✅ Dev login successful:', loginResult);
  
  // Now navigate to a page to establish the session in the browser context
  console.log('📍 Navigating to /auth to establish session in browser...');
  await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('✅ Page loaded');
  
  // Verify we're authenticated by checking /api/user
  const userResponse = await request.get('/api/user', { timeout: 15000 });
  if (!userResponse.ok()) {
    throw new Error(`User verification failed: ${userResponse.status()}`);
  }
  
  const userData = await userResponse.json();
  console.log('✅ User verified:', userData);
  
  // Wait a moment for session to be fully established
  await page.waitForTimeout(500);
  
  // Save the storage state for other tests
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  console.log('✅ Storage state saved');
});