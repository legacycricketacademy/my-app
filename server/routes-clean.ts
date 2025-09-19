import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import cors from "cors";
import { storage } from "./storage";
import { multiTenantStorage } from "./multi-tenant-storage";
import { setupAuth } from "./auth";
import { requireAdmin, requireCoach, requireParent } from "./middleware/require-role";
import { z } from "zod";
import { db } from "@db";
import { desc, and, or, sql } from "drizzle-orm";
import Stripe from "stripe";
import { verifyFirebaseToken } from "./firebase-admin";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { registerHandler } from "./routes/register";
import { 
  insertPlayerSchema, 
  insertSessionSchema, 
  insertFitnessRecordSchema, 
  insertMealPlanSchema, 
  insertMealItemSchema, 
  insertAnnouncementSchema, 
  insertPaymentSchema,
  insertConnectionRequestSchema,
  insertUserSchema,
  connectionRequests,
  academies,
  users,
  userAuditLogs,
  userRoles
} from "@shared/schema";
import { 
  sendEmail, 
  generateInvitationEmail, 
  generateVerificationEmail,
  generateForgotPasswordEmail, 
  generateForgotUsernameEmail,
  generateCoachPendingApprovalEmail,
  generateCoachApprovedEmail,
  generateAdminCoachApprovalRequestEmail
} from "./email";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUsernameExistsError,
  sendEmailExistsError,
  sendDatabaseError,
  sendEmailSendError as sendEmailSendFailure,
  sendInvalidCredentialsError,
  sendUserNotVerifiedError,
  sendAccountLockedError,
  sendAccountDisabledError,
  sendTooManyAttemptsError,
  sendSessionExpiredError,
  sendAuthorizationRequiredError
} from "./api-response";
import { hashPassword, comparePasswords } from "./auth";
import { resendVerificationEmail } from "./services/auth-service";
import { eq } from "drizzle-orm";
import {
  createSuccessResponse,
  createErrorResponse,
  createAuthResponse,
  createUnauthorizedResponse
} from "./utils/api-response";

// API prefix for routes
const apiPrefix = "/api";

// Add a force-logout endpoint that destroys the session without relying on passport
// This provides a more reliable way to logout when sessions are stuck
function setupForceLogoutEndpoint(app: Express) {
  app.post(`${apiPrefix}/force-logout`, (req, res) => {
    console.log("Received force-logout request");
    
    if (req.session) {
      console.log("Destroying session for force-logout");
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Error during force logout", error: err.message });
        }
        
        console.log("Session successfully destroyed");
        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Force logout successful" });
      });
    } else {
      console.log("No session found to destroy");
      return res.status(200).json({ message: "No session to logout" });
    }
  });
}

// Initialize Stripe conditionally
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('Missing Stripe secret key. Stripe functionality will be limited.');
}

// Helper function to parse CSV data
function parseCsvData(csvData: string) {
  // Replace escaped \n with actual newlines
  const cleanedData = csvData.replace(/\\n/g, "\n");
  const lines = cleanedData.split("\n").filter(line => line.trim() !== "");
  const headers = lines[0].split(",").map(header => header.trim());
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(val => val.trim());
    const record: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      if (index < values.length) {
        record[header] = values[index];
      }
    });
    
    data.push(record);
  }
  
  return data;
}

// Helper function to parse JSON data
function parseJsonData(jsonData: string) {
  try {
    const data = JSON.parse(jsonData);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
}

// Function to generate a secure token
function generateToken(payload: any, expiresInMs: number): string {
  // Create token with payload and expiration
  const tokenPayload = {
    ...payload,
    expires: Date.now() + expiresInMs,
  };
  
  // Convert to base64
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  return token;
}

// Function to verify a token
function verifyToken(token: string): { valid: boolean; payload?: any } {
  try {
    // Decode token
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token has expired
    if (payload.expires < Date.now()) {
      return { valid: false };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}

// Function to generate a secure invitation token
function generateInvitationToken(playerId: number, parentEmail: string): string {
  return generateToken(
    { playerId, email: parentEmail },
    7 * 24 * 60 * 60 * 1000 // 7 days expiration
  );
}

// Function to verify an invitation token
function verifyInvitationToken(token: string): { valid: boolean; playerId?: number; email?: string; } {
  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return { valid: false };
  }
  
  return {
    valid: true,
    playerId: result.payload.playerId,
    email: result.payload.email
  };
}

// Function to generate a secure email verification token
function generateVerificationToken(userId: number, email: string): string {
  return generateToken(
    { userId, email },
    24 * 60 * 60 * 1000 // 24 hours expiration
  );
}

// Function to verify an email verification token
function verifyVerificationToken(token: string): { valid: boolean; userId?: number; email?: string; } {
  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return { valid: false };
  }
  
  return {
    valid: true,
    userId: result.payload.userId,
    email: result.payload.email
  };
}

// Function to generate a password reset token
function generatePasswordResetToken(userId: number, email: string): string {
  return generateToken(
    { userId, email },
    60 * 60 * 1000 // 1 hour expiration
  );
}

// Function to verify a password reset token
function verifyPasswordResetToken(token: string): { valid: boolean; userId?: number; email?: string; } {
  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return { valid: false };
  }
  
  return {
    valid: true,
    userId: result.payload.userId,
    email: result.payload.email
  };
}

// Make token functions available globally for use in other modules
declare global {
  namespace NodeJS {
    interface Global {
      generateToken: (payload: any, expiresInMs: number) => string;
      verifyToken: (token: string) => { valid: boolean; payload?: any };
      generateVerificationToken: (userId: number, email: string) => string;
      verifyVerificationToken: (token: string) => { valid: boolean; userId?: number; email?: string };
      generateInvitationToken: (playerId: number, parentEmail: string) => string;
      verifyInvitationToken: (token: string) => { valid: boolean; playerId?: number; email?: string };
      generatePasswordResetToken: (userId: number, email: string) => string;
      verifyPasswordResetToken: (token: string) => { valid: boolean; userId?: number; email?: string };
    }
  }
}

// Assign functions to global scope
(global as any).generateToken = generateToken;
(global as any).verifyToken = verifyToken;
(global as any).generateVerificationToken = generateVerificationToken;
(global as any).verifyVerificationToken = verifyVerificationToken;
(global as any).generateInvitationToken = generateInvitationToken;
(global as any).verifyInvitationToken = verifyInvitationToken;
(global as any).generatePasswordResetToken = generatePasswordResetToken;
(global as any).verifyPasswordResetToken = verifyPasswordResetToken;

// Process and import player data
async function processPlayersData(playersData: any[]) {
  const results = {
    imported: 0,
    errors: [] as string[],
  };

  // Keep track of players we've already seen to avoid duplicates
  const processedPlayers = new Map<string, boolean>();

  for (const playerData of playersData) {
    try {
      // Clean up and normalize data
      // Trim whitespace from string fields
      for (const key in playerData) {
        if (typeof playerData[key] === 'string') {
          playerData[key] = playerData[key].trim();
        }
      }
      
      // Check if firstName exists (this is absolutely required)
      if (!playerData.firstName) {
        results.errors.push(`Missing first name for a player record`);
        continue; // Cannot proceed without a first name
      }
      
      // Now check all required fields
      const requiredFields = ["firstName", "lastName", "dateOfBirth", "ageGroup", "parentEmail"];
      let missingFields = requiredFields.filter(field => !playerData[field]);
      
      // Try to fix missing fields where possible
      let fixedFields = [];
      
      // Fix missing lastName by using firstName
      if (missingFields.includes("lastName")) {
        // Use firstName as lastName if lastName is missing
        playerData.lastName = playerData.firstName;
        console.log(`Using first name "${playerData.firstName}" as last name for player`);
        fixedFields.push("lastName");
        missingFields = missingFields.filter(field => field !== "lastName");
      }
      
      // Generate parent email if missing
      if (missingFields.includes("parentEmail")) {
        playerData.parentEmail = `${playerData.firstName.toLowerCase()}${playerData.lastName.toLowerCase()}parent@cricket.example.com`;
        console.log(`Generated parent email ${playerData.parentEmail} for ${playerData.firstName}`);
        fixedFields.push("parentEmail");
        missingFields = missingFields.filter(field => field !== "parentEmail");
      }
      
      // Report the original missing fields in errors
      if (requiredFields.some(field => !playerData[field])) {
        const originalMissingFields = requiredFields.filter(field => !playerData[field]);
        results.errors.push(`Missing required fields for ${playerData.firstName} ${playerData.lastName || "Player"}: ${originalMissingFields.join(", ")}`);
      }
      
      // Report fixed fields if any
      if (fixedFields.length > 0) {
        console.log(`Fixed fields for ${playerData.firstName}: ${fixedFields.join(", ")}`);
      }
      
      // If we still have missing fields after our fixes, skip this record
      if (missingFields.length > 0) {
        console.log(`Cannot import ${playerData.firstName} - still missing: ${missingFields.join(", ")}`);
        continue;
      }
      
      // Ensure all optional fields have default values if missing
      if (!playerData.parentPhone) {
        playerData.parentPhone = ""; // Set empty string as default
      }
      
      if (!playerData.parentName && playerData.parentEmail) {
        // Extract name from email
        const emailName = playerData.parentEmail.split('@')[0];
        playerData.parentName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        console.log(`Generated parent name "${playerData.parentName}" from email for ${playerData.firstName}`);
      }

      // Check if parent exists by email
      let parentUser = await storage.getUserByEmail(playerData.parentEmail);
      
      // If parent doesn't exist, create a new parent user
      if (!parentUser) {
        // Generate username and password from parent name and email
        const parentName = playerData.parentName || "Parent";
        const nameParts = parentName.split(" ");
        const firstName = nameParts[0].toLowerCase();
        const initialUsername = `${firstName}${Math.floor(Math.random() * 1000)}`;
        
        // Generate a random password
        const tempPassword = Math.random().toString(36).slice(-8);
        
        try {
          const newUserData = {
            username: initialUsername,
            password: tempPassword, // This will be hashed in storage.createUser
            email: playerData.parentEmail,
            fullName: playerData.parentName || "Parent",
            role: "parent" as const,
            phone: playerData.parentPhone || "",
          };
          
          // Create the parent user
          parentUser = await storage.createUser(newUserData);
          
          // TODO: In a production system, send an email to the parent with their login credentials
          console.log(`Created new parent user: ${initialUsername} with temp password: ${tempPassword}`);
        } catch (error: any) {
          results.errors.push(`Failed to create parent account for ${playerData.parentEmail}: ${error.message || 'Unknown error'}`);
          continue;
        }
      }

      // Handle missing dateOfBirth
      if (!playerData.dateOfBirth) {
        // If we have ageGroup, estimate a birth year based on the age group
        if (playerData.ageGroup) {
          const currentYear = new Date().getFullYear();
          let estimatedAge = 0;
          
          if (playerData.ageGroup.toLowerCase().includes("under 8")) {
            estimatedAge = 6; // Average age for Under 8
          } else if (playerData.ageGroup.toLowerCase().includes("under 12")) {
            estimatedAge = 10; // Average age for Under 12
          } else if (playerData.ageGroup.toLowerCase().includes("under 14")) {
            estimatedAge = 12; // Average age for Under 14
          } else if (playerData.ageGroup.toLowerCase().includes("under 16")) {
            estimatedAge = 14; // Average age for Under 16
          } else {
            estimatedAge = 8; // Default estimate
          }
          
          const estimatedYear = currentYear - estimatedAge;
          playerData.dateOfBirth = `${estimatedYear}-01-01`;
          console.log(`Estimated date of birth ${playerData.dateOfBirth} for ${playerData.firstName} based on age group ${playerData.ageGroup}`);
        } else {
          // If we don't have age group, try to guess based on the player's name
          // For all the players that failed with missing birth dates, use a default age of 8
          playerData.dateOfBirth = `${new Date().getFullYear() - 8}-01-01`;
          playerData.ageGroup = "Under 8"; // Assume Under 8 for players without an age group
          
          console.log(`Using default date of birth ${playerData.dateOfBirth} and age group ${playerData.ageGroup} for ${playerData.firstName}`);
          fixedFields.push("dateOfBirth", "ageGroup");
          
          // Remove these from missing fields since we've added defaults
          missingFields = missingFields.filter(field => field !== "dateOfBirth" && field !== "ageGroup");
        }
      }
      
      // Handle missing ageGroup
      if (!playerData.ageGroup) {
        // Try to determine age group from date of birth
        try {
          const dob = new Date(playerData.dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          
          // Adjust age if birthday hasn't occurred yet this year
          if (
            today.getMonth() < dob.getMonth() || 
            (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
          ) {
            age--;
          }
          
          // Assign age group based on age
          if (age < 8) {
            playerData.ageGroup = "Under 8";
          } else if (age < 12) {
            playerData.ageGroup = "Under 12";
          } else if (age < 14) {
            playerData.ageGroup = "Under 14";
          } else {
            playerData.ageGroup = "Under 16";
          }
          
          console.log(`Determined age group ${playerData.ageGroup} for ${playerData.firstName} based on date of birth`);
        } catch (error) {
          // Default to Under 12 if we can't calculate
          playerData.ageGroup = "Under 12";
          console.log(`Using default age group ${playerData.ageGroup} for ${playerData.firstName}`);
        }
      }
      
      // Check if player already exists (combine firstName, lastName, and parentId to check)
      const playerKey = `${playerData.firstName.toLowerCase()}-${playerData.lastName.toLowerCase()}-${parentUser.id}`;
      
      // If we've already processed this player, skip it to avoid creating duplicate entries
      if (processedPlayers.has(playerKey)) {
        console.log(`Skipping duplicate player ${playerData.firstName} ${playerData.lastName}`);
        results.errors.push(`Skipped duplicate player ${playerData.firstName} ${playerData.lastName}`);
        continue;
      }
      
      // Check if this player already exists in the database
      try {
        const existingPlayer = await storage.getPlayerByNameAndParent(
          playerData.firstName, 
          playerData.lastName, 
          parentUser.id
        );
        
        if (existingPlayer) {
          console.log(`Player ${playerData.firstName} ${playerData.lastName} already exists with ID ${existingPlayer.id}`);
          results.errors.push(`Player ${playerData.firstName} ${playerData.lastName} already exists in the database`);
          processedPlayers.set(playerKey, true);
          continue;
        }
      } catch (error) {
        // If there's an error checking for existing player, log it but continue with creation
        console.log(`Error checking for existing player: ${error}`);
      }
      
      // Create the player record
      const newPlayerData = {
        firstName: playerData.firstName,
        lastName: playerData.lastName,
        dateOfBirth: new Date(playerData.dateOfBirth),
        ageGroup: playerData.ageGroup,
        parentId: parentUser.id,
        playerType: playerData.playerType || null,
        emergencyContact: playerData.emergencyContact || null,
        medicalInformation: playerData.medicalInformation || null,
      };
      
      console.log("Attempting to create player:", JSON.stringify(newPlayerData));
      
      try {
        // Validate with schema
        const validatedData = insertPlayerSchema.parse(newPlayerData);
        
        // Create the player
        const player = await storage.createPlayer(validatedData);
        console.log("Player created successfully:", player.id);
        
        // Mark this player as processed to avoid creating duplicates within the same import
        processedPlayers.set(playerKey, true);
        
        results.imported++;
      } catch (validationError: any) {
        console.error("Player validation or creation error:", 
          validationError instanceof z.ZodError 
            ? JSON.stringify(validationError.errors) 
            : validationError.message || 'Unknown error'
        );
        
        // Add to errors instead of throwing so we can continue with other players
        results.errors.push(`Error creating player ${playerData.firstName} ${playerData.lastName}: ${
          validationError instanceof z.ZodError 
            ? validationError.errors.map(e => `${e.path}: ${e.message}`).join(', ') 
            : validationError.message || 'Unknown error'
        }`);
        
        // Continue processing other players instead of throwing
        continue;
      }
      
    } catch (error: any) {
      results.errors.push(`Error processing player ${playerData.firstName || ""} ${playerData.lastName || ""}: ${error.message || 'Unknown error'}`);
    }
  }

  return results;
}

export async function registerRoutes(app: Express): Promise<Server> {
}
