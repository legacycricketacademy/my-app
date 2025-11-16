import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not set. Email functionality will not work.');
}

// Academy info - replace with your actual data
const ACADEMY_NAME = 'Legacy Cricket Academy';
// Important: This MUST be an email address that is verified in your SendGrid account
// Clean up any whitespace from environment variable
const ACADEMY_EMAIL = process.env.SENDGRID_FROM_EMAIL ? process.env.SENDGRID_FROM_EMAIL.trim() : 'madhukar.kcc@gmail.com'; // Verified sender email
const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'madhukar.kcc@gmail.com';
const ACADEMY_WEBSITE = 'https://legacycricketacademy.com';

// Log and check the SendGrid configuration on startup
console.log('SendGrid Configuration Check:', {
  apiKeyPresent: !!process.env.SENDGRID_API_KEY,
  senderEmail: ACADEMY_EMAIL,
  defaultFromEmail: 'madhukar.kcc@gmail.com',
  environment: process.env.NODE_ENV,
  bypassEmailSending: process.env.BYPASS_EMAIL_SENDING,
  emailSandbox: process.env.EMAIL_SANDBOX
});

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
  type?: string; // e.g., 'registration_welcome', 'admin_notification', etc.
}

// Email Sandbox Store (in-memory)
export interface SandboxEmail {
  timestamp: Date;
  to: string;
  subject: string;
  body: string;
  html: string;
  type: string;
}

const emailSandboxStore: SandboxEmail[] = [];

// Sandbox email functions
export function getSandboxEmails(): SandboxEmail[] {
  return [...emailSandboxStore].reverse(); // Most recent first
}

export function clearSandboxEmails(): void {
  emailSandboxStore.length = 0;
}

function captureSandboxEmail(params: SendEmailParams): void {
  const email: SandboxEmail = {
    timestamp: new Date(),
    to: params.to,
    subject: params.subject,
    body: params.text,
    html: params.html,
    type: params.type || 'unknown'
  };
  emailSandboxStore.push(email);
  console.log(`📧 EMAIL SANDBOX: Captured email (type: ${email.type}) to ${email.to}`);
}

// Use this flag to bypass email sending for testing
const DEV_MODE_NO_EMAIL = process.env.NODE_ENV === 'development' && process.env.BYPASS_EMAIL_SENDING === 'true';
const EMAIL_SANDBOX_ENABLED = process.env.EMAIL_SANDBOX === 'true';

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  // If EMAIL_SANDBOX is enabled, capture email instead of sending
  if (EMAIL_SANDBOX_ENABLED) {
    captureSandboxEmail(params);
    return true;
  }
  // In development, log email but don't send if bypass flag is set
  if (DEV_MODE_NO_EMAIL) {
    console.log('DEV MODE: Email would have been sent:');
    console.log('  To:', params.to);
    console.log('  From:', ACADEMY_EMAIL);
    console.log('  Subject:', params.subject);
    console.log('  Text:', params.text.substring(0, 100) + '...');
    return true; // Return true to simulate successful sending
  }
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Cannot send email: SENDGRID_API_KEY not set');
    return false;
  }

  try {
    console.log('Attempting to send email to:', params.to);
    console.log('Using sender email:', ACADEMY_EMAIL);
    
    // Create email message object
    const msg = {
      to: params.to,
      from: {
        email: ACADEMY_EMAIL,
        name: ACADEMY_NAME,  // Adding a proper name helps with deliverability
      },
      subject: params.subject,
      text: params.text,
      html: params.html,
    };
    
    // Show more details about what we're trying to send
    console.log('Email details:', {
      to: msg.to,
      from: msg.from.email,
      subject: msg.subject,
      hasHtmlContent: !!msg.html,
      hasTextContent: !!msg.text,
    });
    
    try {
      // Attempt to send email with the message we created
      const response = await sgMail.send(msg);
      
      console.log('Email API response:', {
        statusCode: response[0]?.statusCode,
        headers: response[0]?.headers ? 'Present' : 'Missing'
      });
      
      console.log('Email sent successfully to:', params.to);
      return true;
    } catch (sendError: any) {
      // Log detailed SendGrid error information
      console.error('SendGrid API error:', {
        message: sendError.message,
        code: sendError.code,
        response: sendError.response?.body ? {
          statusCode: sendError.response.statusCode,
          body: sendError.response.body,
          errors: sendError.response.body?.errors
        } : 'No response body'
      });
      
      // If it's an authentication error with the SendGrid API key
      if (sendError.response?.body?.errors?.some((e: any) => 
          e.message?.includes('authorization') || e.message?.includes('authenticated'))) {
        console.error('SendGrid authentication failed - API key may be invalid or revoked');
      }
      
      throw sendError;
    }
  } catch (error: any) {
    console.error('Email sending error:', error?.message || error);
    console.error('Error details:', error);
    return false;
  }
}

// Simple helper function for sending app emails
export async function sendAppEmail(to: string, subject: string, text: string): Promise<any> {
  const result = await sendEmail({
    to,
    subject,
    text,
    html: `<p>${text}</p>`
  });
  
  console.log('sendAppEmail result:', { statusCode: result ? 'success' : 'failed', body: result });
  return result;
}

export function generateInvitationEmail(
  parentName: string,
  playerName: string,
  invitationLink: string
): { text: string; html: string } {
  // Plain text version
  const text = `
Hello ${parentName},

You are invited to join the ${ACADEMY_NAME} parent portal for ${playerName}.

Use this link to create your account: ${invitationLink}

The link will expire in 7 days.

Thanks,
${ACADEMY_NAME} Team
`;

  // HTML version (more visually appealing)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .button { display: inline-block; padding: 10px 20px; color: white; background-color: #4f46e5; 
              text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${ACADEMY_NAME}</h1>
    </div>
    <div class="content">
      <p>Hello ${parentName},</p>
      <p>You are invited to join the ${ACADEMY_NAME} parent portal for <strong>${playerName}</strong>.</p>
      <p>Click the button below to create your account:</p>
      <a href="${invitationLink}" class="button">Create Your Account</a>
      <p><em>This invitation link will expire in 7 days.</em></p>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p>${invitationLink}</p>
      <p>Thanks,<br>${ACADEMY_NAME} Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ${ACADEMY_NAME}</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

export function generateVerificationEmail(
  fullName: string,
  verificationLink: string
): { text: string; html: string } {
  // Plain text version
  const text = `
Hello ${fullName},

Thank you for registering with ${ACADEMY_NAME}. Please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 24 hours.

Thanks,
${ACADEMY_NAME} Team
`;

  // HTML version (more visually appealing)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .button { display: inline-block; padding: 10px 20px; color: white; background-color: #4f46e5; 
              text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${ACADEMY_NAME}</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>
      <p>Thank you for registering with ${ACADEMY_NAME}.</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationLink}" class="button">Verify Email Address</a>
      <p><em>This verification link will expire in 24 hours.</em></p>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p>${verificationLink}</p>
      <p>Thanks,<br>${ACADEMY_NAME} Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ${ACADEMY_NAME}</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

export function generateForgotPasswordEmail(
  fullName: string,
  resetLink: string
): { text: string; html: string } {
  // Plain text version
  const text = `
Hello ${fullName},

We received a request to reset your password for your ${ACADEMY_NAME} account. Please click the link below to reset your password:

${resetLink}

This link will expire in 1 hour. If you did not request a password reset, please ignore this email.

Thanks,
${ACADEMY_NAME} Team
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .button { display: inline-block; padding: 10px 20px; color: white; background-color: #4f46e5; 
              text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${ACADEMY_NAME}</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>
      <p>We received a request to reset your password for your ${ACADEMY_NAME} account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetLink}" class="button">Reset Password</a>
      <p><em>This reset link will expire in 1 hour.</em></p>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p>${resetLink}</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Thanks,<br>${ACADEMY_NAME} Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ${ACADEMY_NAME}</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

export function generateForgotUsernameEmail(
  fullName: string,
  username: string
): { text: string; html: string } {
  // Plain text version
  const text = `
Hello ${fullName},

You (or someone else) requested your username for ${ACADEMY_NAME}.

Your username is: ${username}

If you did not make this request, please ignore this email.

Thanks,
${ACADEMY_NAME} Team
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .username-box { padding: 15px; background-color: #f0f0f0; border-radius: 4px; font-size: 18px; 
                   margin: 20px 0; text-align: center; font-weight: bold; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${ACADEMY_NAME}</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>
      <p>You (or someone else) requested your username for ${ACADEMY_NAME}.</p>
      <p>Your username is:</p>
      <div class="username-box">${username}</div>
      <p>If you did not make this request, please ignore this email.</p>
      <p>Thanks,<br>${ACADEMY_NAME} Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ${ACADEMY_NAME}</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

export function generateCoachPendingApprovalEmail(
  coachName: string
): { text: string; html: string } {
  // Plain text version
  const text = `
Hello ${coachName},

Thank you for registering as a coach with ${ACADEMY_NAME}.

Your account is currently pending approval by an administrator. You will receive another email once your account has been approved.

In the meantime, you can log in to your account but will have limited access until approval.

Thanks,
${ACADEMY_NAME} Team
`;

  // HTML version with improved design and anti-spam measures
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Coach Registration - Pending Approval</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .status-box { padding: 15px; background-color: #fff4e5; border-left: 4px solid #ff9800; 
                 border-radius: 4px; margin: 20px 0; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
    .whitelist-notice { font-size: 11px; color: #999; margin-top: 10px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${ACADEMY_NAME}</h1>
    </div>
    <div class="content">
      <p>Hello ${coachName},</p>
      <p>Thank you for registering as a coach with ${ACADEMY_NAME}.</p>
      <div class="status-box">
        <p><strong>Account Status: Pending Approval</strong></p>
        <p>Your account is currently pending approval by an administrator. You will receive another email once your account has been approved.</p>
      </div>
      <p>In the meantime, you can log in to your account but will have limited access until approval.</p>
      <p>Thanks,<br>${ACADEMY_NAME} Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message sent to you because you registered for ${ACADEMY_NAME}.</p>
      <p>&copy; ${new Date().getFullYear()} ${ACADEMY_NAME}</p>
      <div class="whitelist-notice">
        <p>To ensure you receive our emails, please add ${ACADEMY_EMAIL} to your contacts.</p>
        <p>If you believe you received this email in error, please ignore this message.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

export function generateCoachApprovedEmail(
  coachName: string,
  loginLink: string = ACADEMY_WEBSITE
): { text: string; html: string } {
  // Plain text version
  const text = `
Hello ${coachName},

Great news! Your coach account with ${ACADEMY_NAME} has been approved.

You now have full access to the coaching features and can log in using your credentials.

Login here: ${loginLink}

Thanks,
${ACADEMY_NAME} Team
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .success-box { padding: 15px; background-color: #e6f7e6; border-left: 4px solid #4caf50; 
                 border-radius: 4px; margin: 20px 0; }
    .button { display: inline-block; padding: 10px 20px; color: white; background-color: #4f46e5; 
              text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${ACADEMY_NAME}</h1>
    </div>
    <div class="content">
      <p>Hello ${coachName},</p>
      <div class="success-box">
        <p><strong>Congratulations!</strong> Your coach account has been approved.</p>
        <p>You now have full access to the coaching features and can log in using your credentials.</p>
      </div>
      <p>Click the button below to access your coach dashboard:</p>
      <a href="${loginLink}" class="button">Login to Your Account</a>
      <p>Thanks,<br>${ACADEMY_NAME} Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ${ACADEMY_NAME}</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}

// Admin notification for new coach registrations
export function generateAdminCoachApprovalRequestEmail(
  coachName: string,
  coachEmail: string,
  coachId: number,
  approvalLink: string = `${ACADEMY_WEBSITE}/coaches-pending-approval`
): { text: string; html: string } {
  // Plain text version
  const text = `
Hello Admin,

A new coach has registered and is awaiting approval:

Coach Name: ${coachName}
Email: ${coachEmail}
ID: ${coachId}

Please login to the admin dashboard to approve or reject this coach: ${approvalLink}

Thanks,
${ACADEMY_NAME} System
`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .coach-info { padding: 15px; background-color: #f5f5f5; border-radius: 4px; margin: 20px 0; }
    .button { display: inline-block; padding: 10px 20px; color: white; background-color: #4f46e5; 
              text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .important { color: #d32f2f; font-weight: bold; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${ACADEMY_NAME}</h1>
    </div>
    <div class="content">
      <p>Hello Admin,</p>
      <p><strong>A new coach has registered and is awaiting your approval.</strong></p>
      
      <div class="coach-info">
        <p><strong>Coach Name:</strong> ${coachName}</p>
        <p><strong>Email:</strong> ${coachEmail}</p>
        <p><strong>ID:</strong> ${coachId}</p>
      </div>
      
      <p>Please log in to the admin dashboard to review and approve or reject this coach:</p>
      <a href="${approvalLink}" class="button">Go to Admin Dashboard</a>
      
      <p class="important">This requires your immediate attention to ensure smooth onboarding.</p>
      
      <p>Thanks,<br>${ACADEMY_NAME} System</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ${ACADEMY_NAME}</p>
    </div>
  </div>
</body>
</html>
`;

  return { text, html };
}