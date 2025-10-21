import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RUN_LOCAL_WEB = process.env.RUN_LOCAL_WEB === '1';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 1,
  workers: CI ? 4 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 90000, // 90 seconds per test (allows for Render cold starts + retries)
  use: {
    baseURL: BASE_URL,
    actionTimeout: 15000,
    navigationTimeout: 60000,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  expect: {
    timeout: 10000, // 10 seconds for expect assertions
  },

  projects: [
    // Setup project (runs first to create auth state)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 90000, // 90 seconds for setup (allows for Render cold starts + retries)
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Desktop Chrome (your current default)
    {
      name: "Desktop Chrome",
      dependencies: ['setup'],
      use: {
        ...devices["Desktop Chrome"],
        storageState: 'playwright/.auth/admin.json',
      },
    },
    
    // Mobile — Pixel 5 (Chromium + touch + DPR + UA + viewport)
    {
      name: "Mobile Chrome (Pixel 5)",
      dependencies: ['setup'],
      use: {
        ...devices["Pixel 5"],
        storageState: 'playwright/.auth/admin.json',
      },
    },
    
    // Uncomment for iOS WebKit emulation:
    // {
    //   name: "Mobile Safari (iPhone 13)",
    //   dependencies: ['setup'],
    //   use: {
    //     ...devices["iPhone 13"],
    //     storageState: 'playwright/.auth/admin.json',
    //   },
    // },
  ],

  webServer: RUN_LOCAL_WEB ? {
    command: 'npm start',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120 * 1000,
  } : undefined,
});

