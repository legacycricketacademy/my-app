import { test, expect } from '@playwright/test';

test.describe('Email Sandbox - Registration Flow', () => {
  test('should capture registration welcome email in sandbox', async ({ request }) => {
    // Clear sandbox before test
    await request.delete('http://127.0.0.1:3000/api/dev/test-emails');

    // Perform registration
    const registrationData = {
      parentName: 'Test Parent E2E',
      email: 'e2e-test@example.com',
      phone: '555-0000',
      childName: 'Test Child E2E',
      ageGroup: 'U11',
      role: 'parent'
    };

    const registerResponse = await request.post('http://127.0.0.1:3000/api/registration', {
      data: registrationData
    });

    expect(registerResponse.ok()).toBeTruthy();

    // Check sandbox emails
    const emailsResponse = await request.get('http://127.0.0.1:3000/api/dev/test-emails');
    expect(emailsResponse.ok()).toBeTruthy();

    const emailsData = await emailsResponse.json();
    expect(emailsData.success).toBe(true);
    expect(emailsData.count).toBeGreaterThan(0);

    // Find registration welcome email
    const welcomeEmail = emailsData.emails.find((email: any) => 
      email.type === 'registration_welcome'
    );

    expect(welcomeEmail).toBeDefined();
    expect(welcomeEmail.to).toBe(registrationData.email);
    expect(welcomeEmail.subject).toContain('Welcome');
    expect(welcomeEmail.subject).toContain('Legacy Cricket Academy');
    expect(welcomeEmail.body).toContain(registrationData.parentName);
    expect(welcomeEmail.body).toContain(registrationData.childName);
  });

  test('should clear sandbox emails via DELETE endpoint', async ({ request }) => {
    // Add some emails first
    await request.post('http://127.0.0.1:3000/api/registration', {
      data: {
        parentName: 'Clear Test',
        email: 'clear@example.com',
        childName: 'Clear Child',
        role: 'parent'
      }
    });

    // Verify emails exist
    let emailsResponse = await request.get('http://127.0.0.1:3000/api/dev/test-emails');
    let emailsData = await emailsResponse.json();
    expect(emailsData.count).toBeGreaterThan(0);

    // Clear sandbox
    const deleteResponse = await request.delete('http://127.0.0.1:3000/api/dev/test-emails');
    expect(deleteResponse.ok()).toBeTruthy();

    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);
    expect(deleteData.message).toContain('cleared');

    // Verify emails are cleared
    emailsResponse = await request.get('http://127.0.0.1:3000/api/dev/test-emails');
    emailsData = await emailsResponse.json();
    expect(emailsData.count).toBe(0);
    expect(emailsData.emails).toHaveLength(0);
  });

  test('should return emails in reverse chronological order', async ({ request }) => {
    // Clear sandbox
    await request.delete('http://127.0.0.1:3000/api/dev/test-emails');

    // Create first registration
    await request.post('http://127.0.0.1:3000/api/registration', {
      data: {
        parentName: 'First Parent',
        email: 'first@example.com',
        childName: 'First Child',
        role: 'parent'
      }
    });

    // Wait for email to be captured
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create second registration
    await request.post('http://127.0.0.1:3000/api/registration', {
      data: {
        parentName: 'Second Parent',
        email: 'second@example.com',
        childName: 'Second Child',
        role: 'parent'
      }
    });

    // Wait for second email to be captured
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get emails
    const emailsResponse = await request.get('http://127.0.0.1:3000/api/dev/test-emails');
    const emailsData = await emailsResponse.json();

    const welcomeEmails = emailsData.emails.filter((email: any) => 
      email.type === 'registration_welcome'
    );

    expect(welcomeEmails.length).toBeGreaterThanOrEqual(2);
    
    // Newest should be first (second@example.com)
    expect(welcomeEmails[0].to).toBe('second@example.com');
    expect(welcomeEmails[1].to).toBe('first@example.com');
  });
});
