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

  const httpServer = createServer(app);
  return httpServer;
}
