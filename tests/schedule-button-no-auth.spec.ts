import { test, expect } from '@playwright/test';

// Skip auth setup - we'll test the button mechanics directly
test.use({ storageState: { cookies: [], origins: [] } });

test('schedule button mechanics test (skip auth)', async ({ page }) => {
  console.log('🔵 Testing button mechanics without full auth...');
  
  // Go directly to schedule page (will probably redirect to auth, but let's see)
  await page.goto('/dashboard/schedule', { waitUntil: 'networkidle' });
  
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/schedule-no-auth.png', fullPage: true });
  
  // If we're still on schedule page (not redirected)
  if (currentUrl.includes('/schedule') || currentUrl.includes('/dashboard')) {
    console.log('✅ On a dashboard-related page');
    
    // Look for debug indicators
    const blueIndicator = page.locator('text=Modal State:');
    const addSessionButton = page.getByRole('button', { name: /add session/i });
    const testButton = page.getByRole('button', { name: /test modal/i });
    
    console.log('Blue indicator visible:', await blueIndicator.isVisible());
    console.log('Add Session button count:', await addSessionButton.count());
    console.log('Test button count:', await testButton.count());
    
    if (await addSessionButton.count() > 0) {
      console.log('✅ Found Add Session button');
      
      // Click it
      await addSessionButton.first().click();
      await page.waitForTimeout(1000);
      
      // Take screenshot after click
      await page.screenshot({ path: 'test-results/after-button-click.png', fullPage: true });
      
      // Check for indicators
      const greenIndicator = page.locator('text=State is TRUE');
      const testOverlay = page.locator('text=TEST: Modal State is TRUE');
      
      console.log('Green indicator visible:', await greenIndicator.isVisible());
      console.log('Test overlay visible:', await testOverlay.isVisible());
      
      if (await testOverlay.isVisible()) {
        console.log('✅✅✅ SUCCESS! State is working, Dialog component is the issue');
      } else {
        console.log('❌ State not updating or component not rendering');
      }
    }
  } else {
    console.log('⚠️ Redirected to:', currentUrl);
  }
});

