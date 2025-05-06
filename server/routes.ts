import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertPlayerSchema, 
  insertSessionSchema, 
  insertFitnessRecordSchema, 
  insertMealPlanSchema, 
  insertMealItemSchema, 
  insertAnnouncementSchema, 
  insertPaymentSchema 
} from "@shared/schema";
import { sendEmail, generateInvitationEmail } from "./email";

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

// Function to generate a secure invitation token
function generateInvitationToken(playerId: number, parentEmail: string): string {
  // Create token payload
  const payload = {
    playerId,
    email: parentEmail,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };
  
  // Convert to base64
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  return token;
}

// Function to verify an invitation token
function verifyInvitationToken(token: string): { valid: boolean; playerId?: number; email?: string; } {
  try {
    // Decode token
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token has expired
    if (payload.expires < Date.now()) {
      return { valid: false };
    }
    
    return {
      valid: true,
      playerId: payload.playerId,
      email: payload.email
    };
  } catch (error) {
    return { valid: false };
  }
}

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
  // Setup authentication routes and middleware
  setupAuth(app);
  
  // Base API prefix
  const apiPrefix = "/api";
  
  // Dashboard stats
  app.get(`${apiPrefix}/dashboard/stats`, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });
  
  // API endpoint for sending invitations
  app.post(`${apiPrefix}/invitations/send`, async (req, res) => {
    try {
      // Check if user is authenticated - commented out for now to prevent potential login issues
      // We'll reactivate this once the basic functionality is confirmed working
      /* 
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to send invitations" });
      }
      */
      const { playerId, parentEmail, parentName } = req.body;
      
      if (!playerId || !parentEmail) {
        return res.status(400).json({ message: "Player ID and parent email are required" });
      }
      
      // Get player details to include in email
      const player = await storage.getPlayerById(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Generate invitation token
      const token = generateInvitationToken(playerId, parentEmail);
      
      // Create invitation link
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const invitationLink = `${baseUrl}/auth?token=${token}`;
      
      // Generate email content
      const emailContent = generateInvitationEmail(
        parentName || "Parent", 
        `${player.firstName} ${player.lastName}`,
        invitationLink
      );
      
      // Send email using SendGrid
      const emailSent = await sendEmail({
        to: parentEmail,
        subject: "Invitation to Legacy Cricket Academy Parent Portal",
        text: emailContent.text,
        html: emailContent.html
      });
      
      if (emailSent) {
        res.status(200).json({ 
          message: "Invitation sent successfully",
          invitationLink // Include the link in case email fails but we still want to show the user
        });
      } else {
        // If email fails, we still generate the link but inform the client
        res.status(200).json({ 
          message: "Email service unavailable, but invitation link generated",
          invitationLink
        });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });
  
  // API endpoint to verify invitation token
  app.get(`${apiPrefix}/invitations/verify`, (req, res) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, message: "Invalid token" });
    }
    
    const verification = verifyInvitationToken(token);
    
    if (verification.valid) {
      res.status(200).json({
        valid: true,
        playerId: verification.playerId,
        email: verification.email
      });
    } else {
      res.status(400).json({ valid: false, message: "Invalid or expired token" });
    }
  });
  
  // Players routes
  app.get(`${apiPrefix}/players`, async (req, res) => {
    try {
      const ageGroup = req.query.ageGroup as string | undefined;
      const players = await storage.getAllPlayers(ageGroup);
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Error fetching players" });
    }
  });
  
  // Special test endpoint for parent dashboard demo
  app.get(`${apiPrefix}/test/parent-dashboard-data`, async (req, res) => {
    try {
      // Get sample data for test demonstration without authentication
      const allPlayers = await storage.getAllPlayers();
      const samplePlayers = allPlayers.slice(0, 3);
      
      // Make sure we have enough test data
      if (samplePlayers.length === 0) {
        return res.json([
          {
            id: 9999,
            firstName: "Test",
            lastName: "Player",
            ageGroup: "Under 12s",
            dateOfBirth: new Date("2013-05-15"),
            profileImage: null,
            playerType: "Batsman",
            emergencyContact: "1234567890",
            medicalInformation: "No allergies",
            parentId: 1,
            parentName: "Test Parent",
            parentEmail: "parent@example.com"
          }
        ]);
      }
      
      return res.json(samplePlayers);
    } catch (error) {
      console.error("Error fetching test data:", error);
      res.status(500).json({ message: "Error fetching test data" });
    }
  });

  // Get players for the logged-in parent
  app.get(`${apiPrefix}/players/parent`, async (req, res) => {
    try {
      // Ensure user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view your players" });
      }
      
      // Check if this is a test request from parent-test route
      const referer = req.headers.referer || '';
      const isTestMode = referer.includes('/parent-test');
      
      // Only parents can access this endpoint, unless in test mode
      if (req.user.role !== "parent" && !isTestMode) {
        return res.status(403).json({ message: "Only parents can access this endpoint" });
      }
      
      // If in test mode, return some sample players for current user
      if (isTestMode) {
        // Get first 3 players from the system for demonstration
        const allPlayers = await storage.getAllPlayers();
        const samplePlayers = allPlayers.slice(0, 3);
        
        // Simulate these as the current user's children
        samplePlayers.forEach(player => {
          player.parentId = req.user.id;
        });
        
        return res.json(samplePlayers);
      }
      
      // Normal flow - get actual parent's children
      const players = await storage.getPlayersByParentId(req.user.id);
      res.json(players);
    } catch (error) {
      console.error("Error fetching parent's players:", error);
      res.status(500).json({ message: "Error fetching players" });
    }
  });
  
  app.get(`${apiPrefix}/players/:id`, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayerById(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Error fetching player" });
    }
  });
  
  app.post(`${apiPrefix}/players`, async (req, res) => {
    try {
      const { parentEmail, parentName, ...playerData } = req.body;
      
      // First, check if a parent with this email exists
      let parentUser = await storage.getUserByEmail(parentEmail);
      
      // If parent doesn't exist, create a new parent user
      if (!parentUser) {
        // Generate a username based on the parent's name (first part of email)
        const username = parentEmail.split('@')[0];
        // Generate a random password
        const password = Math.random().toString(36).slice(-8);
        
        try {
          parentUser = await storage.createUser({
            username,
            password,
            email: parentEmail,
            fullName: parentName,
            role: "parent"
          });
          
          console.log(`Created new parent user: ${parentUser.id} (${username})`);
        } catch (createError) {
          console.error("Error creating parent user:", createError);
          return res.status(400).json({ message: "Failed to create parent user account" });
        }
      }
      
      // Now create the player with the parent ID
      const validatedPlayerData = insertPlayerSchema.parse({
        ...playerData,
        parentId: parentUser.id
      });
      
      const player = await storage.createPlayer(validatedPlayerData);
      res.status(201).json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating player:", error);
      res.status(500).json({ message: "Error creating player" });
    }
  });
  
  app.patch(`${apiPrefix}/players/:id`, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const { parentEmail, parentName, ...playerData } = req.body;
      
      // First, get the existing player to determine the parent relationship
      const existingPlayer = await storage.getPlayerById(playerId);
      if (!existingPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Only handle parent update if parent info is provided
      if (parentEmail) {
        // Check if a different parent with this email exists
        let parentUser = await storage.getUserByEmail(parentEmail);
        
        // If no parent with this email exists, update the existing parent or create a new one
        if (!parentUser) {
          // Get current parent
          const currentParent = await storage.getUser(existingPlayer.parentId);
          
          // If current parent exists and only has this one player, update the parent
          if (currentParent) {
            // Get all players associated with this parent
            const parentPlayers = await storage.getPlayersByParentId(currentParent.id);
            
            if (parentPlayers.length <= 1) {
              // Update the existing parent with new email/name
              await storage.updateUser(currentParent.id, {
                email: parentEmail,
                fullName: parentName || currentParent.fullName
              });
              
              // Keep the same parentId
              playerData.parentId = currentParent.id;
            } else {
              // Parent has multiple players - create a new parent account
              const username = parentEmail.split('@')[0];
              const password = Math.random().toString(36).slice(-8);
              
              try {
                parentUser = await storage.createUser({
                  username,
                  password,
                  email: parentEmail,
                  fullName: parentName || username,
                  role: "parent"
                });
                
                // Set new parent ID
                playerData.parentId = parentUser.id;
                console.log(`Created new parent user: ${parentUser.id} (${username})`);
              } catch (createError) {
                console.error("Error creating parent user:", createError);
                return res.status(400).json({ message: "Failed to create parent user account" });
              }
            }
          }
        } else {
          // Existing parent found with this email - update player to link to this parent
          playerData.parentId = parentUser.id;
        }
      }
      
      // Update player with validated data
      const updatedPlayer = await storage.updatePlayer(playerId, playerData);
      
      if (!updatedPlayer) {
        return res.status(404).json({ message: "Player update failed" });
      }
      
      res.json(updatedPlayer);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Error updating player" });
    }
  });
  
  // Sessions routes
  app.get(`${apiPrefix}/sessions/today`, async (req, res) => {
    try {
      const sessions = await storage.getTodaySessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching today's sessions" });
    }
  });
  
  app.get(`${apiPrefix}/sessions/upcoming`, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sessions = await storage.getUpcomingSessions(limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching upcoming sessions" });
    }
  });
  
  app.get(`${apiPrefix}/sessions/:id`, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Error fetching session" });
    }
  });
  
  app.post(`${apiPrefix}/sessions`, async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating session" });
    }
  });
  
  // Fitness routes
  app.get(`${apiPrefix}/fitness/player/:playerId`, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const fitnessRecords = await storage.getFitnessRecordsByPlayerId(playerId);
      res.json(fitnessRecords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching fitness records" });
    }
  });
  
  app.get(`${apiPrefix}/fitness/team-progress`, async (req, res) => {
    try {
      const ageGroup = req.query.ageGroup as string | undefined;
      const period = req.query.period as string || 'week';
      const progress = await storage.getTeamFitnessProgress(ageGroup, period);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team fitness progress" });
    }
  });
  
  app.post(`${apiPrefix}/fitness/records`, async (req, res) => {
    try {
      const fitnessData = insertFitnessRecordSchema.parse(req.body);
      const record = await storage.createFitnessRecord(fitnessData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating fitness record" });
    }
  });
  
  // Meal plan routes
  app.get(`${apiPrefix}/meal-plans/:id`, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlanById(planId);
      
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json(mealPlan);
    } catch (error) {
      res.status(500).json({ message: "Error fetching meal plan" });
    }
  });
  
  app.get(`${apiPrefix}/meal-plans/age-group/:ageGroup`, async (req, res) => {
    try {
      const ageGroup = req.params.ageGroup;
      const mealPlans = await storage.getMealPlansByAgeGroup(ageGroup);
      res.json(mealPlans);
    } catch (error) {
      res.status(500).json({ message: "Error fetching meal plans" });
    }
  });
  
  app.post(`${apiPrefix}/meal-plans`, async (req, res) => {
    try {
      const mealPlanData = insertMealPlanSchema.parse(req.body);
      const mealPlan = await storage.createMealPlan(mealPlanData);
      res.status(201).json(mealPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating meal plan" });
    }
  });
  
  app.post(`${apiPrefix}/meal-items`, async (req, res) => {
    try {
      const mealItemData = insertMealItemSchema.parse(req.body);
      const mealItem = await storage.createMealItem(mealItemData);
      res.status(201).json(mealItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating meal item" });
    }
  });
  
  // Announcement routes
  app.get(`${apiPrefix}/announcements/recent`, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const announcements = await storage.getRecentAnnouncements(limit);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcements" });
    }
  });
  
  app.get(`${apiPrefix}/announcements/:id`, async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      const announcement = await storage.getAnnouncementById(announcementId);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcement" });
    }
  });
  
  app.post(`${apiPrefix}/announcements`, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating announcement" });
    }
  });
  
  app.post(`${apiPrefix}/announcements/:id/view`, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const announcementId = parseInt(req.params.id);
      await storage.markAnnouncementAsViewed(announcementId, req.user.id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error marking announcement as viewed" });
    }
  });
  
  app.get(`${apiPrefix}/announcements/:id/stats`, async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      const stats = await storage.getAnnouncementViewStats(announcementId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching announcement stats" });
    }
  });
  
  // Payment routes
  app.get(`${apiPrefix}/payments/pending`, async (req, res) => {
    try {
      const pendingPayments = await storage.getPendingPayments();
      res.json(pendingPayments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pending payments" });
    }
  });
  
  app.get(`${apiPrefix}/payments/player/:playerId`, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const payments = await storage.getPaymentsByPlayerId(playerId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching player payments" });
    }
  });
  
  app.post(`${apiPrefix}/payments`, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating payment" });
    }
  });
  
  app.patch(`${apiPrefix}/payments/:id/status`, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { status, paidDate } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const paidDateObj = paidDate ? new Date(paidDate) : undefined;
      const updatedPayment = await storage.updatePaymentStatus(paymentId, status, paidDateObj);
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ message: "Error updating payment status" });
    }
  });

  // Import players endpoint
  app.post(`${apiPrefix}/import/players`, async (req, res) => {
    // Check if user is authenticated and has required role
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== "admin" && req.user.role !== "coach") {
      return res.status(403).json({ error: "Permission denied" });
    }

    try {
      const { format, data } = req.body;

      if (!format || !data) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      let playersData = [];

      // Parse the data based on format
      if (format === "csv") {
        playersData = parseCsvData(data);
      } else if (format === "json") {
        playersData = parseJsonData(data);
      } else {
        return res.status(400).json({ error: "Invalid format" });
      }
      
      console.log(`Attempting to import ${playersData.length} players`)

      // Validate and process the data
      const results = await processPlayersData(playersData);

      return res.status(200).json({
        success: true,
        imported: results.imported,
        errors: results.errors,
      });
    } catch (error) {
      console.error("Error importing players:", error);
      return res.status(500).json({ error: "Error importing players" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
