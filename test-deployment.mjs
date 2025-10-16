#!/usr/bin/env node

/**
 * Deployment Testing Script for Legacy Cricket Academy
 * Tests both local and Render deployment
 */

import { chromium } from 'playwright';
import fetch from 'node-fetch';

class DeploymentTester {
  constructor() {
    this.localURL = 'http://localhost:3002';
    this.renderURL = process.env.RENDER_URL || 'https://your-app.onrender.com';
    this.testResults = {
      timestamp: new Date().toISOString(),
      local: { passed: 0, failed: 0, tests: [] },
      render: { passed: 0, failed: 0, tests: [] },
      summary: { total: 0, passed: 0, failed: 0 }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Deployment Tests...\n');
    
    try {
      console.log('📱 Testing Local Deployment...');
      await this.testLocalDeployment();
      
      console.log('\n🌐 Testing Render Deployment...');
      await this.testRenderDeployment();
      
      await this.generateSummary();
      await this.saveReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testLocalDeployment() {
    const tests = [
      { name: 'Server Health Check', test: () => this.testHealthCheck(this.localURL) },
      { name: 'Authentication Flow', test: () => this.testAuthentication(this.localURL) },
      { name: 'Dashboard Loading', test: () => this.testDashboard(this.localURL) },
      { name: 'Button Functionality', test: () => this.testButtons(this.localURL) },
      { name: 'API Endpoints', test: () => this.testAPIEndpoints(this.localURL) }
    ];

    for (const { name, test } of tests) {
      try {
        await test();
        this.recordTest('local', name, true);
        console.log(`  ✅ ${name}`);
      } catch (error) {
        this.recordTest('local', name, false, error.message);
        console.log(`  ❌ ${name}: ${error.message}`);
      }
    }
  }

  async testRenderDeployment() {
    const tests = [
      { name: 'Render Health Check', test: () => this.testHealthCheck(this.renderURL) },
      { name: 'Render Authentication', test: () => this.testAuthentication(this.renderURL) },
      { name: 'Render Dashboard', test: () => this.testDashboard(this.renderURL) },
      { name: 'Render API Endpoints', test: () => this.testAPIEndpoints(this.renderURL) }
    ];

    for (const { name, test } of tests) {
      try {
        await test();
        this.recordTest('render', name, true);
        console.log(`  ✅ ${name}`);
      } catch (error) {
        this.recordTest('render', name, false, error.message);
        console.log(`  ❌ ${name}: ${error.message}`);
      }
    }
  }

  async testHealthCheck(url) {
    const response = await fetch(`${url}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error(`Health check returned: ${data.status}`);
    }
  }

  async testAuthentication(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${url}/auth`);
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'Test1234!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/admin', { timeout: 10000 });
      
      // Verify we're on the admin dashboard
      await page.waitForSelector('text=Legacy Cricket Coach Dashboard', { timeout: 5000 });
      
    } finally {
      await browser.close();
    }
  }

  async testDashboard(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Login first
      await page.goto(`${url}/auth`);
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'Test1234!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin');

      // Test dashboard elements
      await page.waitForSelector('text=Dashboard', { timeout: 5000 });
      await page.waitForSelector('button', { timeout: 5000 });
      
      // Check for key widgets
      const widgets = ['Registered Players', 'Upcoming Sessions', 'Pending Payments'];
      for (const widget of widgets) {
        await page.waitForSelector(`text=${widget}`, { timeout: 5000 });
      }
      
    } finally {
      await browser.close();
    }
  }

  async testButtons(url) {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Login first
      await page.goto(`${url}/auth`);
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'Test1234!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin');

      // Test "Add New Player" button
      const addPlayerButton = page.locator('button:has-text("Add New Player")');
      if (await addPlayerButton.count() > 0) {
        await addPlayerButton.click();
        await page.waitForTimeout(2000);
        console.log('    ✅ Add New Player button clicked');
      }

      // Test navigation buttons
      const navButtons = ['Team Management', 'Schedule', 'Fitness Tracking'];
      for (const buttonText of navButtons) {
        const button = page.locator(`text=${buttonText}`);
        if (await button.count() > 0) {
          await button.click();
          await page.waitForTimeout(1000);
          console.log(`    ✅ ${buttonText} navigation clicked`);
        }
      }
      
    } finally {
      await browser.close();
    }
  }

  async testAPIEndpoints(url) {
    const endpoints = [
      '/api/health',
      '/api/user',
      '/api/players',
      '/api/sessions/today',
      '/api/announcements/recent',
      '/api/payments/pending',
      '/api/fitness/team-progress'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${url}${endpoint}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`${endpoint} returned ${response.status}`);
        }
        
        console.log(`    ✅ ${endpoint} - ${response.status}`);
      } catch (error) {
        throw new Error(`${endpoint} failed: ${error.message}`);
      }
    }
  }

  recordTest(environment, testName, passed, error = null) {
    const test = {
      name: testName,
      passed,
      timestamp: new Date().toISOString(),
      error: error || null
    };
    
    this.testResults[environment].tests.push(test);
    
    if (passed) {
      this.testResults[environment].passed++;
    } else {
      this.testResults[environment].failed++;
    }
  }

  async generateSummary() {
    const localTotal = this.testResults.local.passed + this.testResults.local.failed;
    const renderTotal = this.testResults.render.passed + this.testResults.render.failed;
    
    this.testResults.summary = {
      total: localTotal + renderTotal,
      passed: this.testResults.local.passed + this.testResults.render.passed,
      failed: this.testResults.local.failed + this.testResults.render.failed,
      localCoverage: localTotal > 0 ? Math.round((this.testResults.local.passed / localTotal) * 100) : 0,
      renderCoverage: renderTotal > 0 ? Math.round((this.testResults.render.passed / renderTotal) * 100) : 0
    };
  }

  async saveReport() {
    const fs = await import('fs');
    const path = await import('path');
    
    const reportPath = path.join(process.cwd(), 'deployment-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    console.log('\n📊 DEPLOYMENT TEST SUMMARY');
    console.log('==========================');
    console.log(`Total Tests: ${this.testResults.summary.total}`);
    console.log(`Passed: ${this.testResults.summary.passed}`);
    console.log(`Failed: ${this.testResults.summary.failed}`);
    console.log(`Local Coverage: ${this.testResults.summary.localCoverage}%`);
    console.log(`Render Coverage: ${this.testResults.summary.renderCoverage}%`);
    
    console.log('\n📄 Full report saved to: deployment-test-report.json');
    
    if (this.testResults.summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      [...this.testResults.local.tests, ...this.testResults.render.tests]
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DeploymentTester();
  tester.runAllTests().catch(console.error);
}

export default DeploymentTester;
