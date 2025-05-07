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
const ACADEMY_EMAIL = 'madhukar.ashok@gmail.com'; // Replace with your verified sender
const ACADEMY_WEBSITE = 'https://legacycricketacademy.com';

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Cannot send email: SENDGRID_API_KEY not set');
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: ACADEMY_EMAIL,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error: any) {
    console.error('Email sending error:', error?.response?.body || error);
    return false;
  }
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