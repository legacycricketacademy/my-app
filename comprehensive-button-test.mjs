#!/usr/bin/env node

/**
 * Comprehensive Button Test with UI Visible
 * Tests all dashboard buttons and navigation
 */

import { chromium } from 'playwright';

async function comprehensiveButtonTest() {
  console.log('🧪 Comprehensive Button Test - UI Visible\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down actions to see them clearly
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. 🚀 Navigating to login page...');
    await page.goto('http://localhost:3002/auth', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('2. 🔐 Logging in...');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    console.log('3. ⏳ Waiting for admin dashboard...');
    await page.waitForURL('**/admin', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    console.log('4. 📊 Dashboard loaded! Testing buttons...');
    
    // Get page info
    const title = await page.title();
    const url = page.url();
    console.log(`   📄 Page: ${title}`);
    console.log(`   🔗 URL: ${url}`);
    
    // Test main action buttons
    console.log('\n5. 🎯 Testing Main Action Buttons:');
    
    // Look for "Add New Player" button
    const addPlayerSelectors = [
      'button:has-text("Add New Player")',
      'button:has-text("Add Player")',
      'a:has-text("Add New Player")',
      '[data-testid="add-player"]',
      '.add-player-button'
    ];
    
    let addPlayerFound = false;
    for (const selector of addPlayerSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`   ✅ Found Add Player button with selector: ${selector}`);
        await element.click();
        console.log('   ✅ Add Player button clicked successfully!');
        await page.waitForTimeout(2000);
        addPlayerFound = true;
        break;
      }
    }
    
    if (!addPlayerFound) {
      console.log('   ❌ Add Player button not found');
    }
    
    // Test Schedule button
    const scheduleSelectors = [
      'button:has-text("Schedule New Session")',
      'button:has-text("Schedule Session")',
      'a:has-text("Schedule")',
      '[data-testid="schedule-session"]'
    ];
    
    let scheduleFound = false;
    for (const selector of scheduleSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`   ✅ Found Schedule button with selector: ${selector}`);
        await element.click();
        console.log('   ✅ Schedule button clicked successfully!');
        await page.waitForTimeout(2000);
        scheduleFound = true;
        break;
      }
    }
    
    if (!scheduleFound) {
      console.log('   ❌ Schedule button not found');
    }
    
    // Test navigation sidebar
    console.log('\n6. 🧭 Testing Sidebar Navigation:');
    
    const navItems = [
      'Dashboard',
      'Team Management', 
      'Schedule',
      'Fitness Tracking',
      'Meal Plans',
      'Announcements',
      'Payments'
    ];
    
    for (const navItem of navItems) {
      const navSelectors = [
        `text=${navItem}`,
        `a:has-text("${navItem}")`,
        `button:has-text("${navItem}")`,
        `[data-testid="${navItem.toLowerCase().replace(' ', '-')}"]`
      ];
      
      let navFound = false;
      for (const selector of navSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          console.log(`   ✅ Found ${navItem} navigation`);
          await element.click();
          console.log(`   ✅ ${navItem} clicked successfully!`);
          await page.waitForTimeout(1500);
          navFound = true;
          break;
        }
      }
      
      if (!navFound) {
        console.log(`   ❌ ${navItem} navigation not found`);
      }
    }
    
    // Test dashboard widget buttons
    console.log('\n7. 📊 Testing Dashboard Widget Buttons:');
    
    const widgetButtons = [
      'View All',
      'Add Player',
      'Add Session',
      'Send Announcement'
    ];
    
    for (const buttonText of widgetButtons) {
      const element = page.locator(`text=${buttonText}`);
      if (await element.count() > 0) {
        console.log(`   ✅ Found widget button: ${buttonText}`);
        await element.click();
        console.log(`   ✅ ${buttonText} clicked successfully!`);
        await page.waitForTimeout(1000);
      } else {
        console.log(`   ❌ Widget button not found: ${buttonText}`);
      }
    }
    
    // List all buttons found on the page
    console.log('\n8. 📋 All Buttons Found on Page:');
    const allButtons = await page.locator('button').all();
    console.log(`   Found ${allButtons.length} buttons:`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const buttonText = await allButtons[i].textContent();
      const isVisible = await allButtons[i].isVisible();
      console.log(`   ${i + 1}. "${buttonText}" (visible: ${isVisible})`);
    }
    
    // List all links found on the page
    console.log('\n9. 🔗 All Links Found on Page:');
    const allLinks = await page.locator('a').all();
    console.log(`   Found ${allLinks.length} links:`);
    
    for (let i = 0; i < allLinks.length; i++) {
      const linkText = await allLinks[i].textContent();
      const href = await allLinks[i].getAttribute('href') || await allLinks[i].getAttribute('to');
      const isVisible = await allLinks[i].isVisible();
      console.log(`   ${i + 1}. "${linkText}" -> ${href} (visible: ${isVisible})`);
    }
    
    console.log('\n🎉 Comprehensive Button Test Completed!');
    console.log('\nPress any key to close the browser...');
    
    // Keep browser open for inspection
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await browser.close();
  }
}

comprehensiveButtonTest();
