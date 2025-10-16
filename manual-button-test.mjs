#!/usr/bin/env node

/**
 * Simple Manual Button Test
 */

import { chromium } from 'playwright';

async function testButtons() {
  console.log('🧪 Testing Dashboard Buttons...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Go to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3002/auth');
    
    // Login
    console.log('2. Logging in...');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    console.log('3. Waiting for admin dashboard...');
    await page.waitForURL('**/admin', { timeout: 10000 });
    
    // Check what's on the page
    console.log('4. Checking page content...');
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    // Look for buttons
    console.log('5. Testing buttons...');
    
    // Test "Add New Player" button
    const addPlayerBtn = page.locator('button:has-text("Add New Player")');
    const addPlayerCount = await addPlayerBtn.count();
    console.log(`   Add New Player button found: ${addPlayerCount > 0 ? '✅' : '❌'}`);
    
    if (addPlayerCount > 0) {
      await addPlayerBtn.click();
      console.log('   ✅ Add New Player button clicked successfully');
      await page.waitForTimeout(2000);
    }
    
    // Test navigation buttons
    const navButtons = ['Team Management', 'Schedule', 'Fitness Tracking', 'Meal Plans'];
    for (const buttonText of navButtons) {
      const button = page.locator(`text=${buttonText}`);
      const count = await button.count();
      console.log(`   ${buttonText} navigation: ${count > 0 ? '✅' : '❌'}`);
      
      if (count > 0) {
        await button.click();
        console.log(`   ✅ ${buttonText} clicked successfully`);
        await page.waitForTimeout(1000);
      }
    }
    
    console.log('\n🎉 Button test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testButtons();
