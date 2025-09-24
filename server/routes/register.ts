import { Request, Response } from "express";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUsernameExistsError,
  sendEmailExistsError
} from '../api-response';
import { ApiSuccessResponse } from "@shared/api-types";
import { generateAdminCoachApprovalRequestEmail, sendEmail } from "../email";

export async function registerHandler(req: Request, res: Response) {
  try {
    const { username, password, email, fullName, role, phone } = req.body;

    if (!username || !password || !email || !fullName || !role) {
      return sendValidationError(res, 'Missing required fields', ['username', 'email', 'password', 'fullName', 'role']);
    }

    // Mock user validation - in production, this would check the database
    const existingUser = null; // Mock: no existing user
    if (existingUser) return sendUsernameExistsError(res, username);

    const existingEmail = null; // Mock: no existing email
    if (existingEmail) return sendEmailExistsError(res, email);

    // Mock user creation - in production, this would save to database
    const user = { 
      id: `user-${Date.now()}`,
      username, 
      email, 
      fullName, 
      role, 
      phone, 
      academyId: 1,
      isEmailVerified: false,
      emailVerificationRequired: true
    };

    // If this is a coach registration, send admin notification
    if (role === 'coach') {
      try {
        console.log('Coach registration detected - sending admin notification');
        const adminEmail = 'madhukar.kcc@gmail.com';
        const adminName = 'Administrator';
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;
        
        // Create approval link
        const approvalLink = `${baseUrl}/coaches-pending-approval`;
        
        // Generate admin notification
        const adminEmailContent = generateAdminCoachApprovalRequestEmail(
          fullName,
          email,
          user.id
        );
        
        // Send guaranteed admin notification
        await sendEmail({
          to: adminEmail,
          subject: `NEW COACH REGISTRATION - ${fullName} requires approval`,
          text: adminEmailContent.text,
          html: adminEmailContent.html
        });
        
        console.log(`Admin notification sent directly to ${adminEmail}`);
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
        // Don't block registration if email fails
      }
    }
    
    return sendSuccess(res, 'Registration successful! Please verify your email.', { userId: user.id });
  } catch (err) {
    console.error('Registration failed:', err);
    if (err instanceof Error) {
      return sendError(res, 'Registration failed', 'DatabaseError', 500, err.message);
    }
    return sendError(res, 'Internal server error', 'DatabaseError', 500);
  }
}