import { test, expect } from '@playwright/test';

test('Login test - direct API then screenshot', async ({ page }) => {
  const email = 'admin@test.com';
  const password = 'password';
  
  console.log('🔵 Starting direct login test...');
  
  // Navigate to login page
  await page.goto('https://cricket-academy-app.onrender.com/auth', { 
    waitUntil: 'networkidle', 
    timeout: 60000 
  });
  
  console.log('✅ On login page');
  await page.screenshot({ path: 'test-results/01-before-login.png', fullPage: true });
  
  // Use /api/auth/login directly (doesn't require database)
  console.log('🔄 Attempting direct API login...');
  const loginResponse = await page.request.post('/api/auth/login', {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  });
  
  const loginData = await loginResponse.json();
  console.log('📍 Login API Response:', loginResponse.status(), loginData);
  
  if (!loginResponse.ok()) {
    throw new Error(`Login failed: ${loginData.message || 'Unknown error'}`);
  }
  
  // Verify session with whoami
  const whoamiResponse = await page.request.get('/api/whoami', {
    timeout: 30000
  });
  const whoamiData = await whoamiResponse.json();
  console.log('📍 Whoami Response:', whoamiResponse.status(), whoamiData);
  
  if (!whoamiResponse.ok() || !whoamiData.id) {
    throw new Error('Session verification failed');
  }
  
  // Navigate to dashboard
  await page.goto('https://cricket-academy-app.onrender.com/dashboard', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // Wait for dashboard content
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  
  // Take screenshot of successful login
  await page.screenshot({ 
    path: 'test-results/login-success.png', 
    fullPage: true 
  });
  
  console.log('✅ LOGIN SUCCESSFUL - Screenshot saved to test-results/login-success.png');
  
  // Verify dashboard content
  const dashboardContent = await page.textContent('body') || '';
  expect(dashboardContent.toLowerCase()).toMatch(/dashboard|welcome/i);
  
  console.log('✅ Dashboard verified - Login test PASSED');
});

