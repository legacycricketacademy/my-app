#!/usr/bin/env node

/**
 * Debug Page Content
 */

import { chromium } from 'playwright';

async function debugPage() {
  console.log('🔍 Debugging Admin Dashboard Page...\n');
  
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
    
    // Wait for redirect
    console.log('3. Waiting for redirect...');
    await page.waitForURL('**/admin', { timeout: 10000 });
    
    // Get page info
    console.log('4. Page information:');
    const title = await page.title();
    const url = page.url();
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${url}`);
    
    // Get all text content
    console.log('5. Page content:');
    const bodyText = await page.textContent('body');
    console.log(`   Body text length: ${bodyText.length} characters`);
    
    // Get all buttons
    console.log('6. All buttons on page:');
    const buttons = await page.locator('button').all();
    console.log(`   Found ${buttons.length} buttons:`);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      console.log(`   ${i + 1}. "${buttonText}"`);
    }
    
    // Get all links
    console.log('7. All links on page:');
    const links = await page.locator('a').all();
    console.log(`   Found ${links.length} links:`);
    
    for (let i = 0; i < links.length; i++) {
      const linkText = await links[i].textContent();
      const href = await links[i].getAttribute('href');
      console.log(`   ${i + 1}. "${linkText}" -> ${href}`);
    }
    
    // Check for any errors in console
    console.log('8. Checking for console errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   ❌ Console error: ${msg.text()}`);
      }
    });
    
    // Wait a bit to catch any errors
    await page.waitForTimeout(3000);
    
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugPage();
