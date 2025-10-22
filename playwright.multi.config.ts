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
  timeout: 60000, // 60 seconds per test
  retries: 1,
  // ensure same BASE_URL used everywhere
  use: {
    baseURL: BASE_URL,
    storageState: "tests/.state/admin.json",   // <— use saved session
    trace: "on-first-retry",
    actionTimeout: 15000,
    navigationTimeout: 60000,
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  expect: {
    timeout: 10000, // 10 seconds for expect assertions
  },
  globalSetup: "./tests/setup/global.setup.ts",
  projects: [
    { name: "Desktop Chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Chrome (Pixel 5)", use: { ...devices["Pixel 5"] } },
  ],

  webServer: RUN_LOCAL_WEB ? {
    command: 'npm start',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120 * 1000,
  } : undefined,
});

