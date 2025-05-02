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

// Process and import player data
async function processPlayersData(playersData: any[]) {
  const results = {
    imported: 0,
    errors: [] as string[],
  };

  for (const playerData of playersData) {
    try {
      // Check if required fields are present
      const requiredFields = ["firstName", "lastName", "dateOfBirth", "ageGroup", "parentEmail"];
      const missingFields = requiredFields.filter(field => !playerData[field]);
      
      if (missingFields.length > 0) {
        results.errors.push(`Missing required fields for ${playerData.firstName || "Unknown"} ${playerData.lastName || "Player"}: ${missingFields.join(", ")}`);
        continue;
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
      
      // Validate with schema
      const validatedData = insertPlayerSchema.parse(newPlayerData);
      
      // Create the player
      await storage.createPlayer(validatedData);
      results.imported++;
      
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
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.status(201).json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Error creating player" });
    }
  });
  
  app.patch(`${apiPrefix}/players/:id`, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedPlayer = await storage.updatePlayer(playerId, updateData);
      
      if (!updatedPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(updatedPlayer);
    } catch (error) {
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
