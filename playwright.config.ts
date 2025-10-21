import { defineConfig, devices } from '@playwright/test';
import * as os from 'os';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RUN_LOCAL_WEB = process.env.RUN_LOCAL_WEB === '1';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 1, // 1 retry locally helps with flaky tests
  workers: CI ? Math.max(1, os.cpus().length - 1) : undefined,
  reporter: 'html',
  timeout: 30000, // 30 seconds per test
  // globalSetup: "./global-setup.ts", // Disabled - using setup project instead
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry', // Only trace on retries to save disk space
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 15000, // 15 seconds for navigation
  },
  expect: {
    timeout: 10000, // 10 seconds for expect assertions
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 90000, // 90 seconds for setup (allows for Render cold starts + retries)
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
  ],

  webServer: RUN_LOCAL_WEB ? {
    command: 'npm start',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120 * 1000,
  } : undefined,
});
