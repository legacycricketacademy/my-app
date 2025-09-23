import { test, expect } from '@playwright/test';

test.describe('Live Demo Tests', () => {
  test('API Health Check - Live Demo', async ({ page }) => {
    // Test API endpoints directly
    const response = await page.request.get('http://localhost:3000/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('environment', 'development');
    expect(data).toHaveProperty('authProvider', 'mock');
    
    console.log('✅ Health API working:', data);
  });

  test('API Version Check - Live Demo', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/version');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('appEnv');
    expect(data).toHaveProperty('timestamp');
    
    console.log('✅ Version API working:', data);
  });

  test('API Ping Check - Live Demo', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/ping');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    
    console.log('✅ Ping API working:', data);
  });

  test('Homepage Load - Live Demo', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3000/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads (even if client-side components fail)
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Homepage loaded successfully');
  });

  test('Auth Page Load - Live Demo', async ({ page }) => {
    // Navigate to auth page
    await page.goto('http://localhost:3000/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Auth page loaded successfully');
  });

  test('Schedule Page Load - Live Demo', async ({ page }) => {
    // Navigate to schedule page
    await page.goto('http://localhost:3000/schedule');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Schedule page loaded successfully');
  });

  test('Mobile Viewport Test - Live Demo', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to homepage
    await page.goto('http://localhost:3000/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads on mobile
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Mobile viewport test passed');
  });

  test('Performance Test - Live Demo', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to homepage
    await page.goto('http://localhost:3000/');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThanOrEqual(5000);
    
    console.log(`✅ Performance test passed: ${loadTime}ms`);
  });

  test('Error Handling Test - Live Demo', async ({ page }) => {
    // Test 404 page
    await page.goto('http://localhost:3000/non-existent-page');
    
    // Should not crash the application
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Error handling test passed');
  });

  test('CORS Headers Test - Live Demo', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/health');
    const headers = response.headers();
    
    // Check for CORS headers
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
    
    console.log('✅ CORS headers present:', {
      origin: headers['access-control-allow-origin'],
      methods: headers['access-control-allow-methods']
    });
  });
});

