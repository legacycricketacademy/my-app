import { test, expect } from '@playwright/test';

test('Login test with screenshot', async ({ page }) => {
  const email = 'admin@test.com';
  const password = 'password';
  
  console.log('🔵 Starting login test...');
  
  // Navigate to login page
  await page.goto('https://cricket-academy-app.onrender.com/auth', { 
    waitUntil: 'networkidle', 
    timeout: 60000 
  });
  
  console.log('✅ On login page');
  
  // Wait for login form
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.waitForSelector('input[name="password"]', { timeout: 15000 });
  await page.waitForSelector('button[type="submit"]', { timeout: 15000 });
  
  console.log('✅ Login form elements found');
  
  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  console.log('✅ Credentials filled');
  
  // Capture before login
  await page.screenshot({ 
    path: 'test-results/login-before-submit.png', 
    fullPage: true 
  });
  
  // Submit form and wait for navigation or response
  const [response] = await Promise.all([
    page.waitForResponse(resp => 
      resp.url().includes('/api/') && (resp.status() === 200 || resp.status() === 401),
      { timeout: 20000 }
    ).catch(() => null),
    page.click('button[type="submit"]')
  ]);
  
  console.log('✅ Form submitted');
  
  if (response) {
    console.log('📍 API Response:', response.status(), await response.json().catch(() => 'no body'));
  }
  
  // Wait for navigation to dashboard
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    console.log('✅ Navigated to dashboard!');
    
    // Take screenshot of successful login
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.screenshot({ 
      path: 'test-results/login-success.png', 
      fullPage: true 
    });
    
    console.log('✅ LOGIN SUCCESSFUL - Screenshot saved to test-results/login-success.png');
    
    // Verify we're logged in by checking for dashboard elements
    const dashboardContent = await page.textContent('body');
    expect(dashboardContent).toContain('Dashboard');
    
  } catch (e) {
    console.log('❌ LOGIN FAILED - Still on auth page');
    await page.screenshot({ 
      path: 'test-results/login-failed.png', 
      fullPage: true 
    });
    
    // Try direct API login as fallback
    console.log('🔄 Attempting direct API login...');
    const apiResponse = await page.request.post('/api/auth/login', {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('📍 Direct API Response status:', apiResponse.status());
    const apiBody = await apiResponse.json();
    console.log('📍 Direct API Response body:', JSON.stringify(apiBody));
    
    // Check whoami after API login
    const whoamiResponse = await page.request.get('/api/whoami', {
      timeout: 30000
    });
    console.log('📍 Whoami status:', whoamiResponse.status());
    console.log('📍 Whoami body:', await whoamiResponse.json().catch(() => 'no body'));
    
    throw new Error('Login failed - user not redirected to dashboard');
  }
});

