import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL || 'admin@test.com';
const password = process.env.E2E_PASSWORD || 'Test1234!';

test('bootstrap auth and save storage state', async ({ page }) => {
  console.log('🔵 Starting auth setup with:', email);
  
  // Navigate to login page
  await page.goto('/auth', { waitUntil: 'networkidle' });
  console.log('✅ On login page');

  // Check for dev "Use" button (dev environment only)
  const useButtons = page.getByRole('button', { name: /^use$/i });
  const buttonCount = await useButtons.count();
  console.log(`Found ${buttonCount} "Use" buttons`);
  
  if (buttonCount >= 2) {
    // Dev environment - use the "Use" button
    console.log('📍 Dev environment detected');
    await useButtons.nth(1).click();
    console.log('✅ Clicked "Use" button for admin account');
    await page.waitForTimeout(500);
  } else {
    // Production or different login page - fill form manually
    console.log('📍 Production/standard login page - filling manually');
    
    // Try multiple selectors for email field
    const emailSelectors = [
      page.getByPlaceholder(/email/i),
      page.getByLabel(/email/i),
      page.locator('input[name="email"]'),
      page.locator('input[type="email"]'),
      page.locator('#email'),
    ];
    
    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        if (await selector.isVisible({ timeout: 2000 })) {
          await selector.fill(email);
          console.log('✅ Filled email field');
          emailFilled = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!emailFilled) {
      throw new Error('Could not find email input field');
    }
    
    // Try multiple selectors for password field
    const passwordSelectors = [
      page.getByPlaceholder(/password/i),
      page.getByLabel(/password/i),
      page.locator('input[name="password"]'),
      page.locator('input[type="password"]'),
      page.locator('#password'),
    ];
    
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        if (await selector.isVisible({ timeout: 2000 })) {
          await selector.fill(password);
          console.log('✅ Filled password field');
          passwordFilled = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!passwordFilled) {
      throw new Error('Could not find password input field');
    }
  }
  
  // Click the Sign In button
  const signInSelectors = [
    page.getByRole('button', { name: /sign in/i }),
    page.getByRole('button', { name: /login/i }),
    page.locator('button[type="submit"]'),
  ];
  
  let signInClicked = false;
  for (const selector of signInSelectors) {
    try {
      if (await selector.isVisible({ timeout: 2000 })) {
        await selector.click();
        console.log('✅ Clicked Sign In button');
        signInClicked = true;
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }
  
  if (!signInClicked) {
    throw new Error('Could not find Sign In button');
  }
  
  // Wait for navigation away from /auth to any dashboard route
  try {
    await page.waitForURL(/\/(dashboard|admin|parent|coach)(\/.*)?$/i, { timeout: 15000 });
    console.log('✅ Navigated to dashboard URL:', page.url());
  } catch (e) {
    // Fallback: wait for any non-auth URL
    await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15000 });
    console.log('✅ Navigated away from /auth to:', page.url());
  }
  
  // Wait for page to load (use domcontentloaded to avoid hanging)
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  
  // Check if there are any cookies
  const cookies = await page.context().cookies();
  console.log('Cookies count:', cookies.length);
  const sessionCookie = cookies.find(c => c.name === 'connect.sid' || c.name === 'sid');
  if (sessionCookie) {
    console.log('✅ Found session cookie:', sessionCookie.name);
  } else {
    console.log('⚠️ No session cookie found');
    console.log('All cookies:', cookies.map(c => c.name).join(', '));
  }
  
  // Save storage state for authenticated tests
  console.log('✅ Saving storage state');
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  console.log('✅ Auth setup complete!');
});
