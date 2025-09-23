import { test, expect } from '@playwright/test';

test.describe('Auth Step by Step Test', () => {
  test('login process step by step', async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      console.log(`Console ${msg.type()}:`, msg.text());
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    // Step 1: Go to auth page
    console.log('Step 1: Going to auth page');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the auth page
    await expect(page.locator('h2')).toContainText('Legacy Cricket Academy');
    console.log('✓ Auth page loaded');
    
    // Step 2: Fill in credentials
    console.log('Step 2: Filling in credentials');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    console.log('✓ Credentials filled');
    
    // Step 3: Submit form
    console.log('Step 3: Submitting form');
    await page.click('button[type="submit"]');
    console.log('✓ Form submitted');
    
    // Step 4: Wait for redirect
    console.log('Step 4: Waiting for redirect');
    await page.waitForURL('http://localhost:3000/');
    console.log('✓ Redirected to dashboard');
    
    // Step 5: Check what's on the page
    console.log('Step 5: Checking page content');
    const content = await page.content();
    console.log('Page content length:', content.length);
    console.log('Page content preview:', content.substring(0, 500));
    
    // Check if there's an h1 element
    const h1Elements = await page.locator('h1').count();
    console.log('Number of h1 elements:', h1Elements);
    
    if (h1Elements > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log('First h1 text:', h1Text);
    }
    
    // Check if there's a loading spinner
    const loadingSpinner = await page.locator('.animate-spin').count();
    console.log('Number of loading spinners:', loadingSpinner);
    
    // Wait a bit more to see if anything changes
    console.log('Step 6: Waiting for changes');
    await page.waitForTimeout(3000);
    
    const finalContent = await page.content();
    console.log('Final page content preview:', finalContent.substring(0, 500));
    
    // Try to find any text that might indicate the page is working
    const allText = await page.textContent('body');
    console.log('All text content:', allText?.substring(0, 1000));
  });
});

