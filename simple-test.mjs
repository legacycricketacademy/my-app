#!/usr/bin/env node

/**
 * Simple Test to Check What's Happening
 */

import { chromium } from 'playwright';

async function simpleTest() {
  console.log('🔍 Simple Test - Checking What\'s Happening\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. 🌐 Going to localhost:3002...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('2. 📄 Page loaded. Checking content...');
    const title = await page.title();
    console.log(`   Title: ${title}`);
    
    // Check for any error overlays
    const errorOverlay = page.locator('[data-testid="error-overlay"], .error-overlay, [class*="error"]');
    if (await errorOverlay.count() > 0) {
      console.log('   ❌ Error overlay detected!');
      const errorText = await errorOverlay.textContent();
      console.log(`   Error: ${errorText}`);
    }
    
    // Check console for errors
    console.log('3. 🔍 Checking for console errors...');
    let hasErrors = false;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   ❌ Console Error: ${msg.text()}`);
        hasErrors = true;
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (!hasErrors) {
      console.log('   ✅ No console errors detected');
    }
    
    // Check what's actually rendered
    console.log('4. 📊 Checking rendered content...');
    const bodyText = await page.textContent('body');
    console.log(`   Body text length: ${bodyText.length}`);
    
    // Look for login form
    const loginForm = page.locator('form, input[type="email"], input[name="email"]');
    const formCount = await loginForm.count();
    console.log(`   Login forms found: ${formCount}`);
    
    if (formCount > 0) {
      console.log('   ✅ Login form detected!');
    } else {
      console.log('   ❌ No login form found');
    }
    
    // Check for buttons
    const buttons = await page.locator('button').count();
    console.log(`   Buttons found: ${buttons}`);
    
    // Check for links
    const links = await page.locator('a').count();
    console.log(`   Links found: ${links}`);
    
    console.log('\n5. 🎯 Trying to navigate to /auth...');
    await page.goto('http://localhost:3002/auth', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const authTitle = await page.title();
    console.log(`   Auth page title: ${authTitle}`);
    
    const authForm = page.locator('input[type="email"], input[name="email"]');
    const authFormCount = await authForm.count();
    console.log(`   Auth forms found: ${authFormCount}`);
    
    if (authFormCount > 0) {
      console.log('   ✅ Auth page has login form!');
      console.log('   🧪 Testing login...');
      
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'Test1234!');
      await page.click('button[type="submit"]');
      
      console.log('   ✅ Login form submitted!');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`   Current URL after login: ${currentUrl}`);
      
    } else {
      console.log('   ❌ No login form on auth page');
    }
    
    console.log('\n🎉 Simple test completed!');
    console.log('\nPress Ctrl+C to close...');
    
    // Keep browser open for inspection
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

simpleTest();
