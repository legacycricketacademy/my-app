import { describe, it, expect, beforeEach } from 'vitest';
import { getSandboxEmails, clearSandboxEmails } from './email';

// Mock environment for testing
process.env.EMAIL_SANDBOX = 'true';
process.env.NODE_ENV = 'development';

describe('Email Sandbox', () => {
  beforeEach(() => {
    // Clear sandbox before each test
    clearSandboxEmails();
  });

  it('should capture emails when EMAIL_SANDBOX is enabled', async () => {
    const { sendEmail } = await import('./email');
    
    await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'Test body',
      html: '<p>Test body</p>',
      type: 'test_email'
    });

    const emails = getSandboxEmails();
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe('test@example.com');
    expect(emails[0].subject).toBe('Test Email');
    expect(emails[0].type).toBe('test_email');
  });

  it('should return emails in reverse chronological order (newest first)', async () => {
    const { sendEmail } = await import('./email');
    
    // Send three emails with slight delays
    await sendEmail({
      to: 'first@example.com',
      subject: 'First Email',
      text: 'First',
      html: '<p>First</p>',
      type: 'first'
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    await sendEmail({
      to: 'second@example.com',
      subject: 'Second Email',
      text: 'Second',
      html: '<p>Second</p>',
      type: 'second'
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    await sendEmail({
      to: 'third@example.com',
      subject: 'Third Email',
      text: 'Third',
      html: '<p>Third</p>',
      type: 'third'
    });

    const emails = getSandboxEmails();
    expect(emails).toHaveLength(3);
    // Newest first
    expect(emails[0].type).toBe('third');
    expect(emails[1].type).toBe('second');
    expect(emails[2].type).toBe('first');
  });

  it('should clear all emails when clearSandboxEmails is called', async () => {
    const { sendEmail } = await import('./email');
    
    await sendEmail({
      to: 'test1@example.com',
      subject: 'Test 1',
      text: 'Body 1',
      html: '<p>Body 1</p>',
      type: 'test'
    });

    await sendEmail({
      to: 'test2@example.com',
      subject: 'Test 2',
      text: 'Body 2',
      html: '<p>Body 2</p>',
      type: 'test'
    });

    let emails = getSandboxEmails();
    expect(emails).toHaveLength(2);

    clearSandboxEmails();

    emails = getSandboxEmails();
    expect(emails).toHaveLength(0);
  });

  it('should store all required email fields', async () => {
    const { sendEmail } = await import('./email');
    
    await sendEmail({
      to: 'complete@example.com',
      subject: 'Complete Email',
      text: 'Complete body text',
      html: '<p>Complete body HTML</p>',
      type: 'complete_test'
    });

    const emails = getSandboxEmails();
    const email = emails[0];

    expect(email).toHaveProperty('timestamp');
    expect(email).toHaveProperty('to');
    expect(email).toHaveProperty('subject');
    expect(email).toHaveProperty('body');
    expect(email).toHaveProperty('html');
    expect(email).toHaveProperty('type');
    expect(email.timestamp).toBeInstanceOf(Date);
  });
});
