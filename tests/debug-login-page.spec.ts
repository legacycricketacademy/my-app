import { test, expect } from "@playwright/test";

test("Debug login page content", async ({ page }) => {
  await page.goto("/login");
  
  // Wait for page to load
  await page.waitForLoadState("networkidle");
  
  // Log page content
  console.log("Page title:", await page.title());
  console.log("Page URL:", page.url());
  
  // Check for any JavaScript errors
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") {
      errors.push(msg.text());
      console.log("Console error:", msg.text());
    }
  });
  
  page.on("pageerror", error => {
    errors.push(error.message);
    console.log("Page error:", error.message);
  });
  
  // Wait a bit for any errors to appear
  await page.waitForTimeout(2000);
  
  // Check what's actually on the page
  const bodyText = await page.locator("body").textContent();
  console.log("Body text (first 500 chars):", bodyText?.substring(0, 500));
  
  // Check for specific elements
  const emailInput = page.getByTestId("input-email");
  const emailInputCount = await emailInput.count();
  console.log("Email input count:", emailInputCount);
  
  const loginButton = page.getByTestId("btn-login");
  const loginButtonCount = await loginButton.count();
  console.log("Login button count:", loginButtonCount);
  
  // Check for any headings
  const headings = await page.locator("h1, h2, h3").allTextContents();
  console.log("Headings found:", headings);
  
  // Check for any forms
  const forms = await page.locator("form").count();
  console.log("Forms found:", forms);
  
  // Check for React root
  const rootElement = await page.locator("#root").count();
  console.log("Root element count:", rootElement);
  
  // Check for any error messages
  const errorElements = await page.locator('text=/error|Error|ERROR|something went wrong/i').count();
  console.log("Error elements found:", errorElements);
  
  if (errorElements > 0) {
    const errorTexts = await page.locator('text=/error|Error|ERROR|something went wrong/i').allTextContents();
    console.log("Error texts:", errorTexts);
  }
  
  // Log any errors we collected
  if (errors.length > 0) {
    console.log("All errors collected:", errors);
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: "debug-login-page.png" });
  
  // Just check that the page loaded (don't fail the test)
  expect(await page.title()).toBeTruthy();
});
