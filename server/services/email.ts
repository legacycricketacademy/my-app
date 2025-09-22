/**
 * Email Service using SendGrid
 * Handles all email notifications for the application
 */

import sgMail from '@sendgrid/mail';

// Check if email is enabled
export const isEmailEnabled = !!process.env.SENDGRID_API_KEY;

// Initialize SendGrid only if enabled
if (isEmailEnabled) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  console.log('📧 Email service enabled with SendGrid');
} else {
  console.log('📧 Email service disabled - SENDGRID_API_KEY not configured');
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@legacycricketacademy.com';
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO || 'support@legacycricketacademy.com';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailResult {
  sent: boolean;
  id?: string;
  reason?: string;
  preview?: string;
}

/**
 * Send email using SendGrid
 */
async function sendEmail(to: string, template: EmailTemplate): Promise<EmailResult> {
  try {
    if (!isEmailEnabled) {
      const preview = `To: ${to}\nSubject: ${template.subject}\n\n${template.text}`;
      console.log('📧 Email disabled - logging payload:');
      console.log(preview);
      return {
        sent: false,
        reason: 'disabled',
        preview
      };
    }

    const msg = {
      to,
      from: FROM_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const response = await sgMail.send(msg);
    console.log(`📧 Email sent successfully to ${to}`);
    return {
      sent: true,
      id: response[0].headers['x-message-id'] || 'unknown'
    };
  } catch (error) {
    console.error('📧 Error sending email:', error);
    return {
      sent: false,
      reason: error instanceof Error ? error.message : 'unknown_error'
    };
  }
}

/**
 * Welcome email template for new parents
 */
export function welcomeParentTemplate(parentName: string): EmailTemplate {
  return {
    subject: 'Welcome to Legacy Cricket Academy!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Legacy Cricket Academy</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Legacy Cricket Academy!</h1>
          </div>
          <div class="content">
            <h2>Hello ${parentName}!</h2>
            <p>Welcome to Legacy Cricket Academy! We're excited to have you and your child join our cricket family.</p>
            <p>Your account has been successfully created and you can now:</p>
            <ul>
              <li>View your child's training schedule</li>
              <li>Track their progress and fitness data</li>
              <li>Make payments and view payment history</li>
              <li>Receive important announcements</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://cricket-academy.onrender.com'}" class="button">Access Your Dashboard</a>
            </p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The Legacy Cricket Academy Team</p>
          </div>
          <div class="footer">
            <p>Legacy Cricket Academy<br>
            Email: ${REPLY_TO_EMAIL}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Legacy Cricket Academy!
      
      Hello ${parentName}!
      
      Welcome to Legacy Cricket Academy! We're excited to have you and your child join our cricket family.
      
      Your account has been successfully created and you can now:
      - View your child's training schedule
      - Track their progress and fitness data
      - Make payments and view payment history
      - Receive important announcements
      
      Access your dashboard at: ${process.env.CLIENT_URL || 'https://cricket-academy.onrender.com'}
      
      If you have any questions, please don't hesitate to contact us.
      
      Best regards,
      The Legacy Cricket Academy Team
      
      Legacy Cricket Academy
      Email: ${REPLY_TO_EMAIL}
    `
  };
}

/**
 * Child added email template
 */
export function childAddedTemplate(parentName: string, childName: string): EmailTemplate {
  return {
    subject: 'New Child Added to Your Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Child Added</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Child Added!</h1>
          </div>
          <div class="content">
            <h2>Hello ${parentName}!</h2>
            <p>Great news! <strong>${childName}</strong> has been successfully added to your account.</p>
            <p>You can now:</p>
            <ul>
              <li>View ${childName}'s training schedule</li>
              <li>Track their progress and performance</li>
              <li>Make payments for their training</li>
              <li>Receive updates about their development</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://cricket-academy.onrender.com'}" class="button">View Your Dashboard</a>
            </p>
            <p>If you have any questions about ${childName}'s enrollment, please contact us.</p>
            <p>Best regards,<br>The Legacy Cricket Academy Team</p>
          </div>
          <div class="footer">
            <p>Legacy Cricket Academy<br>
            Email: ${REPLY_TO_EMAIL}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Child Added!
      
      Hello ${parentName}!
      
      Great news! ${childName} has been successfully added to your account.
      
      You can now:
      - View ${childName}'s training schedule
      - Track their progress and performance
      - Make payments for their training
      - Receive updates about their development
      
      View your dashboard at: ${process.env.CLIENT_URL || 'https://cricket-academy.onrender.com'}
      
      If you have any questions about ${childName}'s enrollment, please contact us.
      
      Best regards,
      The Legacy Cricket Academy Team
      
      Legacy Cricket Academy
      Email: ${REPLY_TO_EMAIL}
    `
  };
}

/**
 * Payment reminder email template
 */
export function paymentReminderTemplate(parentName: string, amount: number, dueDate: string): EmailTemplate {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
  
  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    subject: 'Payment Reminder - Legacy Cricket Academy',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 4px; }
          .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${parentName}!</h2>
            <p>This is a friendly reminder that you have a payment due for your child's cricket training.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p><strong>Amount Due:</strong></p>
              <p class="amount">${formattedAmount}</p>
              <p><strong>Due Date:</strong> ${formattedDueDate}</p>
            </div>
            <p>Please make your payment as soon as possible to avoid any service interruptions.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://cricket-academy.onrender.com'}/payments" class="button">Make Payment Now</a>
            </p>
            <p>If you have already made this payment, please disregard this reminder.</p>
            <p>If you have any questions about your payment, please contact us immediately.</p>
            <p>Best regards,<br>The Legacy Cricket Academy Team</p>
          </div>
          <div class="footer">
            <p>Legacy Cricket Academy<br>
            Email: ${REPLY_TO_EMAIL}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Payment Reminder
      
      Hello ${parentName}!
      
      This is a friendly reminder that you have a payment due for your child's cricket training.
      
      Amount Due: ${formattedAmount}
      Due Date: ${formattedDueDate}
      
      Please make your payment as soon as possible to avoid any service interruptions.
      
      Make payment at: ${process.env.CLIENT_URL || 'https://cricket-academy.onrender.com'}/payments
      
      If you have already made this payment, please disregard this reminder.
      If you have any questions about your payment, please contact us immediately.
      
      Best regards,
      The Legacy Cricket Academy Team
      
      Legacy Cricket Academy
      Email: ${REPLY_TO_EMAIL}
    `
  };
}

/**
 * Send welcome email to new parent
 */
export async function sendWelcomeParent(parentEmail: string, parentName: string): Promise<EmailResult> {
  const template = welcomeParentTemplate(parentName);
  return await sendEmail(parentEmail, template);
}

/**
 * Send child added notification
 */
export async function sendChildAdded(parentEmail: string, parentName: string, childName: string): Promise<EmailResult> {
  const template = childAddedTemplate(parentName, childName);
  return await sendEmail(parentEmail, template);
}

/**
 * Send payment reminder
 */
export async function sendPaymentReminder(parentEmail: string, parentName: string, amount: number, dueDate: string): Promise<EmailResult> {
  const template = paymentReminderTemplate(parentName, amount, dueDate);
  return await sendEmail(parentEmail, template);
}

/**
 * Test email endpoint (development only)
 */
export async function sendTestEmail(to?: string): Promise<EmailResult> {
  const template = {
    subject: 'Test Email from Legacy Cricket Academy',
    html: `
      <h1>Test Email</h1>
      <p>This is a test email from the Legacy Cricket Academy system.</p>
      <p>If you received this, the email service is working correctly!</p>
    `,
    text: 'Test Email\n\nThis is a test email from the Legacy Cricket Academy system.\n\nIf you received this, the email service is working correctly!'
  };

  return await sendEmail(to || FROM_EMAIL, template);
}
