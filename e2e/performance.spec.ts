import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Homepage Load Performance - Network Idle <= 3s', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance budget: <= 3 seconds
    expect(loadTime).toBeLessThanOrEqual(3000);
    
    console.log(`Homepage load time: ${loadTime}ms`);
  });

  test('Dashboard Load Performance - Network Idle <= 3s', async ({ page }) => {
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
    
    // Performance budget: <= 3 seconds
    expect(loadTime).toBeLessThanOrEqual(3000);
    
    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('Schedule Page Load Performance - Network Idle <= 3s', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const startTime = Date.now();
    
    // Navigate to schedule page
    await page.goto('/schedule');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance budget: <= 3 seconds
    expect(loadTime).toBeLessThanOrEqual(3000);
    
    console.log(`Schedule page load time: ${loadTime}ms`);
  });

  test('API Response Time Performance', async ({ page }) => {
    // Monitor network requests
    const requests: { url: string; duration: number }[] = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        const duration = response.request().timing().responseEnd - response.request().timing().requestStart;
        requests.push({ url, duration });
      }
    });

    // Login and navigate to dashboard
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Wait for all API calls to complete
    await page.waitForLoadState('networkidle');

    // Check API response times
    for (const request of requests) {
      // API responses should be <= 1 second
      expect(request.duration).toBeLessThanOrEqual(1000);
      console.log(`API ${request.url}: ${request.duration}ms`);
    }
  });

  test('Large Data Set Performance', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const startTime = Date.now();
    
    // Navigate to players page (potentially large dataset)
    await page.goto('/players');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance budget: <= 5 seconds for large datasets
    expect(loadTime).toBeLessThanOrEqual(5000);
    
    console.log(`Players page load time: ${loadTime}ms`);
  });

  test('Memory Usage Performance', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    // Login and navigate through multiple pages
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate through multiple pages
    const pages = ['/dashboard', '/schedule', '/players', '/payments', '/announcements'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    // Memory usage should not increase significantly
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThanOrEqual(50 * 1024 * 1024); // 50MB limit
    
    console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB`);
  });

  test('Concurrent User Simulation', async ({ browser }) => {
    // Simulate multiple users accessing the application
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(context => context.newPage()));

    const startTime = Date.now();

    // All users login simultaneously
    await Promise.all(pages.map(async (page, index) => {
      await page.goto('/auth');
      await page.fill('input[type="email"]', index === 0 ? 'admin@test.com' : 'parent@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    }));

    const loginTime = Date.now() - startTime;
    
    // All users should be able to login within 5 seconds
    expect(loginTime).toBeLessThanOrEqual(5000);
    
    console.log(`Concurrent login time: ${loginTime}ms`);

    // Clean up
    await Promise.all(contexts.map(context => context.close()));
  });

  test('Mobile Performance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();
    
    // Navigate to homepage on mobile
    await page.goto('/');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Mobile performance budget: <= 4 seconds
    expect(loadTime).toBeLessThanOrEqual(4000);
    
    console.log(`Mobile homepage load time: ${loadTime}ms`);
  });

  test('Image and Asset Loading Performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to dashboard
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Wait for all resources to load
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // All assets should load within 3 seconds
    expect(loadTime).toBeLessThanOrEqual(3000);
    
    // Check for any failed resource loads
    const failedRequests = await page.evaluate(() => {
      return (window as any).__failedRequests || [];
    });
    
    expect(failedRequests).toEqual([]);
    
    console.log(`Asset loading time: ${loadTime}ms`);
  });

  test('Form Submission Performance', async ({ page }) => {
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
    await page.fill('[data-testid="session-title"]', 'Performance Test Session');
    await page.selectOption('[data-testid="session-type"]', 'practice');
    await page.fill('[data-testid="session-start"]', '2024-12-25T16:00');
    await page.fill('[data-testid="session-end"]', '2024-12-25T18:00');
    await page.fill('[data-testid="session-location"]', 'Field 1');
    
    await page.click('[data-testid="submit-session"]');
    
    // Wait for form submission to complete
    await expect(page.locator('text=Session created successfully')).toBeVisible();
    
    const submissionTime = Date.now() - startTime;
    
    // Form submission should complete within 2 seconds
    expect(submissionTime).toBeLessThanOrEqual(2000);
    
    console.log(`Form submission time: ${submissionTime}ms`);
  });
});

