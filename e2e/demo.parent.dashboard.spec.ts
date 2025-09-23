import { test, expect } from '@playwright/test';

test.describe('Parent Dashboard Demo', () => {
  test('show parent dashboard UI with all cards and functionality', async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'debug' || msg.type() === 'warn' || msg.type() === 'error') {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
      }
    });

    console.log('🚀 Starting Parent Dashboard Demo...');
    
    // Go to auth page first
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to auth page');
    
    // Login as parent
    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✅ Logged in as parent');
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Check dashboard title
    const dashboardTitle = await page.locator('[data-testid="dashboard-title"]').textContent();
    console.log('📋 Dashboard Title:', dashboardTitle);
    
    // Check all dashboard cards
    const statsCard = await page.locator('[data-testid="stats-card"]').isVisible();
    const playersCard = await page.locator('[data-testid="players-card"]').isVisible();
    const fitnessCard = await page.locator('[data-testid="fitness-card"]').isVisible();
    const scheduleCard = await page.locator('[data-testid="schedule-card"]').isVisible();
    const mealCard = await page.locator('[data-testid="meal-plan-card"]').isVisible();
    const paymentsCard = await page.locator('[data-testid="payment-card"]').isVisible();
    const announcementsCard = await page.locator('[data-testid="announcements-card"]').isVisible();
    
    console.log('📊 Dashboard Cards Status:');
    console.log('  - Stats Card:', statsCard ? '✅ Visible' : '❌ Not visible');
    console.log('  - Players Card:', playersCard ? '✅ Visible' : '❌ Not visible');
    console.log('  - Fitness Card:', fitnessCard ? '✅ Visible' : '❌ Not visible');
    console.log('  - Schedule Card:', scheduleCard ? '✅ Visible' : '❌ Not visible');
    console.log('  - Meal Plan Card:', mealCard ? '✅ Visible' : '❌ Not visible');
    console.log('  - Payments Card:', paymentsCard ? '✅ Visible' : '❌ Not visible');
    console.log('  - Announcements Card:', announcementsCard ? '✅ Visible' : '❌ Not visible');
    
    // Check buttons
    const addPlayerButton = await page.locator('text=Add Player').isVisible();
    const viewCalendarButton = await page.locator('text=View Full Calendar').isVisible();
    const viewAllSessionsButton = await page.locator('text=View All Sessions').isVisible();
    
    console.log('🔘 Button Status:');
    console.log('  - Add Player Button:', addPlayerButton ? '✅ Visible' : '❌ Not visible');
    console.log('  - View Full Calendar Button:', viewCalendarButton ? '✅ Visible' : '❌ Not visible');
    console.log('  - View All Sessions Button:', viewAllSessionsButton ? '✅ Visible' : '❌ Not visible');
    
    // Test navigation buttons
    if (viewCalendarButton) {
      console.log('🧪 Testing View Full Calendar button...');
      await page.click('text=View Full Calendar');
      await page.waitForLoadState('networkidle');
      const scheduleUrl = page.url();
      console.log('📍 Navigated to:', scheduleUrl);
      
      // Go back to dashboard
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle');
      console.log('↩️ Returned to dashboard');
    }
    
    if (viewAllSessionsButton) {
      console.log('🧪 Testing View All Sessions button...');
      await page.click('text=View All Sessions');
      await page.waitForLoadState('networkidle');
      const sessionsUrl = page.url();
      console.log('📍 Navigated to:', sessionsUrl);
      
      // Go back to dashboard
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle');
      console.log('↩️ Returned to dashboard');
    }
    
    // Check header elements
    const roleBadge = await page.locator('[data-testid="role-badge"]').isVisible();
    const userMenuTrigger = await page.locator('[data-testid="user-menu-trigger"]').isVisible();
    
    console.log('🎯 Header Elements:');
    console.log('  - Role Badge:', roleBadge ? '✅ Visible' : '❌ Not visible');
    console.log('  - User Menu Trigger:', userMenuTrigger ? '✅ Visible' : '❌ Not visible');
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'parent-dashboard-demo.png', fullPage: true });
    console.log('📸 Screenshot saved as parent-dashboard-demo.png');
    
    // Final verification
    expect(dashboardTitle).toContain('Welcome');
    expect(statsCard).toBe(true);
    expect(playersCard).toBe(true);
    expect(fitnessCard).toBe(true);
    expect(scheduleCard).toBe(true);
    
    console.log('🎉 Parent Dashboard Demo completed successfully!');
  });
});
