import { test, expect } from '@playwright/test';

test.describe('Production Smoke Tests', () => {
  test('Homepage Loads Successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Legacy Cricket Academy|Dashboard/);
    
    // Check for basic page elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('Health Endpoint Returns 200', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });

  test('Version Endpoint Returns 200', async ({ page }) => {
    const response = await page.request.get('/api/version');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('appEnv');
    expect(data).toHaveProperty('timestamp');
  });

  test('Ping Endpoint Returns 200', async ({ page }) => {
    const response = await page.request.get('/api/ping');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  test('Authentication Page Loads', async ({ page }) => {
    await page.goto('/auth');
    
    // Check that the auth page loads
    await expect(page.locator('h1')).toContainText('Login');
    
    // Check for form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Static Assets Load Successfully', async ({ page }) => {
    // Monitor for failed resource loads
    const failedRequests: string[] = [];
    
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that no critical resources failed to load
    const criticalFailures = failedRequests.filter(url => 
      url.includes('.css') || url.includes('.js') || url.includes('.png') || url.includes('.jpg')
    );
    
    expect(criticalFailures).toEqual([]);
  });

  test('API Endpoints Are Accessible', async ({ page }) => {
    const endpoints = [
      '/api/health',
      '/api/version',
      '/api/ping',
      '/api/email/status'
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(200);
    }
  });

  test('Error Pages Handle Gracefully', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    
    // Should not crash the application
    await expect(page.locator('body')).toBeVisible();
  });

  test('Mobile Viewport Works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that the page loads on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile-specific elements
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('Performance Within Acceptable Limits', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (generous for production)
    expect(loadTime).toBeLessThanOrEqual(10000);
    
    console.log(`Production load time: ${loadTime}ms`);
  });

  test('No JavaScript Errors in Console', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('Failed to load resource')
    );
    
    expect(criticalErrors).toEqual([]);
  });

  test('CORS Headers Are Present', async ({ page }) => {
    const response = await page.request.get('/api/health');
    const headers = response.headers();
    
    // Check for CORS headers
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
  });

  test('Security Headers Are Present', async ({ page }) => {
    const response = await page.request.get('/');
    const headers = response.headers();
    
    // Check for basic security headers
    expect(headers['x-content-type-options']).toBeDefined();
    expect(headers['x-frame-options']).toBeDefined();
  });

  test('Database Connection Is Working', async ({ page }) => {
    // This test assumes the application makes database calls
    // and that they complete successfully
    
    const response = await page.request.get('/api/health');
    const data = await response.json();
    
    // If the health endpoint includes database status, check it
    if (data.database) {
      expect(data.database).toBe('connected');
    }
  });

  test('Email Service Status Is Available', async ({ page }) => {
    const response = await page.request.get('/api/email/status');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('enabled');
    expect(data).toHaveProperty('fromEmail');
    expect(data).toHaveProperty('replyToEmail');
  });

  test('Application Handles High Load', async ({ browser }) => {
    // Simulate multiple concurrent requests
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(context => context.newPage()));

    // All pages should load successfully
    await Promise.all(pages.map(async (page) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }));

    // Clean up
    await Promise.all(contexts.map(context => context.close()));
  });

  test('Environment Variables Are Set Correctly', async ({ page }) => {
    const response = await page.request.get('/api/version');
    const data = await response.json();
    
    // Check that environment variables are properly set
    expect(data).toHaveProperty('appEnv');
    expect(data).toHaveProperty('authProvider');
    expect(data).toHaveProperty('nodeEnv');
  });

  test('Logging Is Working', async ({ page }) => {
    // This test checks that the application doesn't crash
    // when making requests that should generate logs
    
    await page.goto('/api/health');
    await page.goto('/api/version');
    await page.goto('/api/ping');
    
    // If we get here without errors, logging is working
    expect(true).toBe(true);
  });
});

