import { test, expect } from "@playwright/test";

test("Check for JavaScript errors on login page", async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Capture console messages
  page.on("console", msg => {
    if (msg.type() === "error") {
      errors.push(`Console Error: ${msg.text()}`);
    } else if (msg.type() === "warning") {
      warnings.push(`Console Warning: ${msg.text()}`);
    }
  });
  
  // Capture page errors
  page.on("pageerror", error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  // Capture unhandled promise rejections
  page.on("unhandledrejection", error => {
    errors.push(`Unhandled Rejection: ${error}`);
  });
  
  await page.goto("/auth");
  
  // Wait for React to attempt to mount
  await page.waitForTimeout(3000);
  
  // Check if React root has any content
  const rootContent = await page.locator("#root").innerHTML();
  console.log("Root content:", rootContent);
  
  // Log all errors
  if (errors.length > 0) {
    console.log("=== ERRORS FOUND ===");
    errors.forEach(error => console.log(error));
  }
  
  if (warnings.length > 0) {
    console.log("=== WARNINGS FOUND ===");
    warnings.forEach(warning => console.log(warning));
  }
  
  // Check if main.tsx loaded
  const scripts = await page.locator("script[src*='main.tsx']").count();
  console.log("Main.tsx script tags found:", scripts);
  
  // Check for any error boundaries or error messages
  const errorElements = await page.locator('text=/error|Error|ERROR|failed|Failed|FAILED/i').count();
  if (errorElements > 0) {
    const errorTexts = await page.locator('text=/error|Error|ERROR|failed|Failed|FAILED/i').allTextContents();
    console.log("Error elements found:", errorTexts);
  }
  
  // Take screenshot
  await page.screenshot({ path: "login-page-errors.png" });
  
  // Don't fail the test, just report
  console.log("Test completed - check console output above for errors");
});
