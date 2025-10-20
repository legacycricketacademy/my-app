import { test, expect } from '@playwright/test';

// Don't use saved storage state for this test - we'll login manually
test.use({ storageState: { cookies: [], origins: [] } });

test('debug: login and check schedule button', async ({ page }) => {
  // Step 1: Go to login
  console.log('Step 1: Navigating to /auth');
  await page.goto('/auth', { waitUntil: 'networkidle' });
  
  // Take screenshot of login page
  await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });
  
  // Check what's on the page
  const loginPageContent = await page.content();
  console.log('Login page title:', await page.title());
  
  // Step 2: Login
  console.log('Step 2: Filling credentials');
  const emailInput = page.getByPlaceholder(/email/i);
  const passwordInput = page.getByPlaceholder(/password/i);
  const signInButton = page.getByRole('button', { name: /sign in/i });
  
  await emailInput.fill('admin@test.com');
  await passwordInput.fill('Test1234!');
  await page.screenshot({ path: 'test-results/02-filled-form.png', fullPage: true });
  
  console.log('Step 3: Clicking sign in');
  await signInButton.click();
  
  // Wait for navigation
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Give it extra time
  
  // Take screenshot after login
  await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });
  
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Check for any heading on the page
  const allHeadings = await page.locator('h1, h2, h3').allTextContents();
  console.log('All headings found:', allHeadings);
  
  // Step 4: Try to navigate to schedule
  console.log('Step 4: Navigating to /dashboard/schedule');
  await page.goto('/dashboard/schedule', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Take screenshot of schedule page
  await page.screenshot({ path: 'test-results/04-schedule-page.png', fullPage: true });
  
  console.log('Schedule page URL:', page.url());
  
  // Check all headings
  const scheduleHeadings = await page.locator('h1, h2, h3').allTextContents();
  console.log('Schedule page headings:', scheduleHeadings);
  
  // Check for the debug indicators I added
  const blueIndicator = page.locator('text=Modal State:');
  if (await blueIndicator.isVisible()) {
    const indicatorText = await blueIndicator.textContent();
    console.log('✅ Found debug indicator:', indicatorText);
  } else {
    console.log('❌ Debug indicator not visible');
  }
  
  // Step 5: Look for Add Session button
  console.log('Step 5: Looking for Add Session button');
  const addSessionButtons = page.getByRole('button', { name: /add session/i });
  const buttonCount = await addSessionButtons.count();
  console.log('Found', buttonCount, 'Add Session button(s)');
  
  if (buttonCount > 0) {
    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/05-before-click.png', fullPage: true });
    
    // Click the first button
    console.log('Step 6: Clicking Add Session button');
    await addSessionButtons.first().click();
    
    // Wait a bit
    await page.waitForTimeout(1000);
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'test-results/06-after-click.png', fullPage: true });
    
    // Check if green indicator appeared
    const greenIndicator = page.locator('text=State is TRUE');
    if (await greenIndicator.isVisible()) {
      console.log('✅ Green debug indicator appeared - state is TRUE');
    } else {
      console.log('❌ Green indicator not visible - state might not be updating');
    }
    
    // Check for test overlay
    const testOverlay = page.locator('text=TEST: Modal State is TRUE');
    if (await testOverlay.isVisible()) {
      console.log('✅ Test overlay appeared - state is working!');
      await page.screenshot({ path: 'test-results/07-test-overlay.png', fullPage: true });
    } else {
      console.log('❌ Test overlay not visible');
    }
    
    // Check for the actual modal
    const modalHeading = page.getByRole('heading', { name: /schedule new session/i });
    if (await modalHeading.isVisible()) {
      console.log('✅ Modal heading visible - modal is working!');
      await page.screenshot({ path: 'test-results/08-modal-open.png', fullPage: true });
    } else {
      console.log('❌ Modal heading not visible');
    }
    
    // Check console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔵') || text.includes('🔄') || text.includes('SchedulePage')) {
        consoleLogs.push(text);
        console.log('Browser console:', text);
      }
    });
    
    // Get all dialogs on the page
    const dialogs = await page.locator('[role="dialog"]').count();
    console.log('Number of dialogs found:', dialogs);
    
    // Final summary
    console.log('\n=== SUMMARY ===');
    console.log('Buttons found:', buttonCount);
    console.log('Blue indicator:', await blueIndicator.isVisible() ? '✅' : '❌');
    console.log('Green indicator:', await greenIndicator.isVisible() ? '✅' : '❌');
    console.log('Test overlay:', await testOverlay.isVisible() ? '✅' : '❌');
    console.log('Modal heading:', await modalHeading.isVisible() ? '✅' : '❌');
    console.log('Dialogs in DOM:', dialogs);
    console.log('================\n');
  } else {
    console.log('❌ No Add Session button found on the page');
    
    // Check what buttons ARE on the page
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons on page:', allButtons);
  }
});

