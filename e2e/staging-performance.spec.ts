import { test, expect } from '@playwright/test';

test.describe('Staging Performance Tests', () => {
  test('Staging Homepage Load Performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to staging homepage
    await page.goto('/');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Staging performance budget: <= 5 seconds (more lenient for staging)
    expect(loadTime).toBeLessThanOrEqual(5000);
    
    console.log(`Staging homepage load time: ${loadTime}ms`);
  });

  test('Staging API Response Times', async ({ page }) => {
    // Monitor network requests
    const requests: { url: string; duration: number; status: number }[] = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        const duration = response.request().timing().responseEnd - response.request().timing().requestStart;
        requests.push({ url, duration, status: response.status() });
      }
    });

    // Test API endpoints
    await page.goto('/api/health');
    await page.goto('/api/version');
    await page.goto('/api/ping');

    // Wait for all requests to complete
    await page.waitForLoadState('networkidle');

    // Check API response times and status codes
    for (const request of requests) {
      // API responses should be <= 2 seconds on staging
      expect(request.duration).toBeLessThanOrEqual(2000);
      expect(request.status).toBe(200);
      console.log(`API ${request.url}: ${request.duration}ms (${request.status})`);
    }
  });

  test('Staging Authentication Performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Test login performance
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    const loginTime = Date.now() - startTime;
    
    // Login should complete within 3 seconds
    expect(loginTime).toBeLessThanOrEqual(3000);
    
    console.log(`Staging login time: ${loginTime}ms`);
  });

  test('Staging Dashboard Load Performance', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const startTime = Date.now();
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 4 seconds on staging
    expect(loadTime).toBeLessThanOrEqual(4000);
    
    console.log(`Staging dashboard load time: ${loadTime}ms`);
  });

  test('Staging Mobile Performance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();
    
    // Navigate to homepage on mobile
    await page.goto('/');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Mobile performance budget: <= 5 seconds on staging
    expect(loadTime).toBeLessThanOrEqual(5000);
    
    console.log(`Staging mobile homepage load time: ${loadTime}ms`);
  });

  test('Staging Database Query Performance', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Test pages that require database queries
    const pages = ['/players', '/schedule', '/payments', '/announcements'];
    
    for (const pageUrl of pages) {
      const startTime = Date.now();
      
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Database queries should complete within 3 seconds
      expect(loadTime).toBeLessThanOrEqual(3000);
      
      console.log(`Staging ${pageUrl} load time: ${loadTime}ms`);
    }
  });

  test('Staging Error Handling Performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Test 404 page load time
    await page.goto('/non-existent-page');
    
    // Wait for 404 page to load
    await page.waitForLoadState('networkidle');
    
    const errorPageTime = Date.now() - startTime;
    
    // Error pages should load quickly
    expect(errorPageTime).toBeLessThanOrEqual(2000);
    
    console.log(`Staging 404 page load time: ${errorPageTime}ms`);
  });

  test('Staging Concurrent Load Performance', async ({ browser }) => {
    // Simulate multiple concurrent users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(context => context.newPage()));

    const startTime = Date.now();

    // All users access the homepage simultaneously
    await Promise.all(pages.map(async (page) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    }));

    const concurrentLoadTime = Date.now() - startTime;
    
    // Concurrent load should complete within 10 seconds
    expect(concurrentLoadTime).toBeLessThanOrEqual(10000);
    
    console.log(`Staging concurrent load time: ${concurrentLoadTime}ms`);

    // Clean up
    await Promise.all(contexts.map(context => context.close()));
  });

  test('Staging Resource Loading Performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to dashboard
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Wait for all resources to load
    await page.waitForLoadState('networkidle');
    
    const resourceLoadTime = Date.now() - startTime;
    
    // All resources should load within 5 seconds on staging
    expect(resourceLoadTime).toBeLessThanOrEqual(5000);
    
    // Check for any failed resource loads
    const failedRequests = await page.evaluate(() => {
      return (window as any).__failedRequests || [];
    });
    
    expect(failedRequests).toEqual([]);
    
    console.log(`Staging resource loading time: ${resourceLoadTime}ms`);
  });

  test('Staging Form Submission Performance', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to admin sessions
    await page.goto('/admin/sessions');
    
    // Open create session dialog
    await page.click('[data-testid="create-session-button"]');
    await expect(page.locator('[data-testid="schedule-dialog"]')).toBeVisible();

    const startTime = Date.now();
    
    // Fill form and submit
    await page.fill('[data-testid="session-title"]', 'Staging Performance Test');
    await page.selectOption('[data-testid="session-type"]', 'practice');
    await page.fill('[data-testid="session-start"]', '2024-12-25T16:00');
    await page.fill('[data-testid="session-end"]', '2024-12-25T18:00');
    await page.fill('[data-testid="session-location"]', 'Field 1');
    
    await page.click('[data-testid="submit-session"]');
    
    // Wait for form submission to complete
    await expect(page.locator('text=Session created successfully')).toBeVisible();
    
    const submissionTime = Date.now() - startTime;
    
    // Form submission should complete within 3 seconds on staging
    expect(submissionTime).toBeLessThanOrEqual(3000);
    
    console.log(`Staging form submission time: ${submissionTime}ms`);
  });
});

