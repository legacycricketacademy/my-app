import { Request, Response } from "express";
import { storage } from "../storage";
import { hashPassword } from "../auth";
import { 
  sendSuccess, 
  sendValidationError, 
  sendUsernameExistsError, 
  sendEmailExistsError, 
  sendDatabaseError,
  sendError
} from "../api-response";

// Set to track processed request IDs to prevent duplicates
const processedRequestIds = new Set<string>();

export async function registerHandler(req: Request, res: Response) {
  try {
    const { username, password, email, fullName, role, phone, academyId, _requestId } = req.body;
    const requestId = _requestId || req.headers['x-request-id'] || `${username}|${email}|${Date.now()}`;
    
    // Check for duplicate requests by ID
    if (processedRequestIds.has(requestId)) {
      console.log(`DUPLICATE REQUEST BLOCKED: Request ID ${requestId} has already been processed`);
      return sendError(
        res,
        "This exact registration was already submitted. Please try a different username or email.",
        409,
        "DuplicateRequest",
        `Request ID ${requestId} has already been processed`,
        "DUPLICATE_REQUEST"
      );
    }
    
    // Add this request ID to the processed set immediately
    processedRequestIds.add(requestId);
    
    // Set a cleanup timeout to prevent memory leaks (remove after 10 minutes)
    setTimeout(() => {
      processedRequestIds.delete(requestId);
    }, 10 * 60 * 1000);
    
    console.log("Registration request received:", {
      username, email, password: '[REDACTED]', fullName, role, phone, requestId
    });
    
    // Validate required fields
    if (!username || !password || !email || !fullName) {
      return sendValidationError(res, "Missing required fields");
    }
    
    // Check if username already exists
    const existingUserByUsername = await storage.getUserByUsername(username);
    if (existingUserByUsername) {
      return sendUsernameExistsError(res, username);
    }
    
    // Check if email already exists
    const existingUserByEmail = await storage.getUserByEmail(email);
    if (existingUserByEmail) {
      return sendEmailExistsError(res, email);
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Determine the appropriate status based on role
    let status = "active";
    let isActive = true;
    
    // Set the appropriate status and activity flag based on role
    if (role === "coach" || role === "admin") {
      status = "pending";  // Coaches and admins need approval
      isActive = false;    // Not active until approved
    }
    
    // Create user in our database
    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || "parent",
      phone,
      status,
      isActive,
      academyId: academyId || null,
      emailVerified: false,
      emailVerificationRequired: true
    });
    
    // Send success response
    return sendSuccess(res, "User created successfully", { 
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return sendDatabaseError(res, error.message || 'Unknown error during registration');
  }
}