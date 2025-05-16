import { Request, Response } from "express";
import { storage } from "../storage";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUsernameExistsError,
  sendEmailExistsError
} from '../api-response';
import { ApiSuccessResponse } from "@shared/api-types";

export async function registerHandler(req: Request, res: Response) {
  try {
    const { username, password, email, fullName, role, phone } = req.body;

    if (!username || !password || !email || !fullName || !role) {
      return sendValidationError(res, 'Missing required fields', ['username', 'email', 'password', 'fullName', 'role']);
    }

    const existingUser = await storage.getUserByUsernameInAcademy(username, 1);
    if (existingUser) return sendUsernameExistsError(res, username);

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) return sendEmailExistsError(res, email);

    const userData = { 
      username, 
      email, 
      password, 
      fullName, 
      role, 
      phone, 
      academyId: 1,
      isEmailVerified: false,
      emailVerificationRequired: true
    };

    const user = await storage.createUser(userData);

    return sendSuccess(res, 'Registration successful! Please verify your email.', { userId: user.id });
  } catch (err) {
    console.error('Registration failed:', err);
    return sendError(res, 'Internal server error');
  }
}