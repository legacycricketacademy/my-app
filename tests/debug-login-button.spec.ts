import { test, expect } from "@playwright/test";

test("Debug login button click", async ({ page }) => {
  const errors: string[] = [];
  
  // Capture console messages
  page.on("console", msg => {
    if (msg.type() === "error") {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  // Capture page errors
  page.on("pageerror", error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  // Capture network requests
  const requests: string[] = [];
  page.on("request", request => {
    if (request.url().includes("/api/")) {
      requests.push(`${request.method()} ${request.url()}`);
    }
  });
  
  await page.goto("/auth");
  await page.waitForLoadState("networkidle");
  
  // Fill in the form
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  
  console.log("Form filled, about to click login button");
  
  // Click the login button
  await page.getByTestId("btn-login").click();
  
  console.log("Login button clicked");
  
  // Wait a bit to see what happens
  await page.waitForTimeout(3000);
  
  // Check current URL
  console.log("Current URL after click:", page.url());
  
  // Check for any network requests
  console.log("API requests made:", requests);
  
  // Check for errors
  if (errors.length > 0) {
    console.log("Errors found:", errors);
  }
  
  // Check if we're still on login page or redirected
  const isStillOnLogin = page.url().includes("/login");
  console.log("Still on login page:", isStillOnLogin);
  
  // Take screenshot
  await page.screenshot({ path: "login-button-click-debug.png" });
  
  // Don't fail the test, just report
  console.log("Debug completed");
});
