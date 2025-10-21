import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Skip auth setup - registration page is public
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Parent registration + email notifications", () => {
  test("registers and sends parent/admin/coach emails", async ({ page, request }) => {
    // Clear mailbox
    const clear = await request.post(`${BASE_URL}/api/_mailbox/clear`);
    expect(clear.ok()).toBeTruthy();

    await page.goto(`${BASE_URL}/login`);
    
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Click register link
    await page.getByTestId("link-register").click();

    // Wait for register page
    await expect(page.getByTestId("heading-register")).toBeVisible();

    const unique = Date.now();
    const parentName = `Test Parent ${unique}`;
    const childName = `Test Kid ${unique}`;
    const email = `parent.${unique}@example.com`;

    // Fill registration form
    await page.getByTestId("reg-parent-name").fill(parentName);
    await page.getByTestId("reg-email").fill(email);
    await page.getByTestId("reg-phone").fill("555-0100");
    await page.getByTestId("reg-child-name").fill(childName);
    await page.getByTestId("reg-age-group").selectOption("U11");
    await page.getByTestId("reg-notes").fill("Automated E2E registration.");
    await page.getByTestId("reg-submit").click();

    // Verify success message
    await expect(page.getByTestId("reg-result")).toContainText("Thank you! We received your registration.");

    // Poll mailbox for emails (parent + admin + coaches)
    let foundParent = false;
    let foundAdmin = false;
    let foundCoach = false;
    
    for (let i = 0; i < 10; i++) {
      const res = await request.get(`${BASE_URL}/api/_mailbox`);
      if (res.ok()) {
        const json = await res.json();
        const msgs = json?.messages || [];
        
        // Check for parent email
        foundParent = msgs.some((m: any) => 
          JSON.stringify(m.to).includes(email) && 
          /Registration Received/i.test(m.subject)
        );
        
        // Check for admin email
        const adminEmail = "madhukar.kcc@gmail.com"; // Known admin email on Render
        foundAdmin = msgs.some((m: any) => 
          /New Registration/i.test(m.subject) && 
          JSON.stringify(m.to).includes(adminEmail)
        );
        
        // Check for coach broadcast email
        foundCoach = msgs.some((m: any) => 
          /New Registration/i.test(m.subject) && 
          Array.isArray(m.to)
        );
        
        if (foundParent && foundAdmin && foundCoach) break;
      }
      await page.waitForTimeout(500);
    }
    
    expect(foundParent, "Parent email not found").toBeTruthy();
    expect(foundAdmin, "Admin email not found").toBeTruthy();
    expect(foundCoach, "Coach broadcast email not found").toBeTruthy();
  });
});

