import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "node:http";
import path from "node:path";
import cors from "cors";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { registerHandler } from "./routes/register.js";

// API prefix for routes
const apiPrefix = "/api";

// Add a force-logout endpoint that destroys the session without relying on passport
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for all routes
  app.use(cors({
    origin: true, // Allow requests from any origin
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
  }));
  
  // Set up the force-logout endpoint
  setupForceLogoutEndpoint(app);
  
  // Set up authentication routes
  setupAuth(app);
  
  // Register handler for user registration
  // registerHandler(app); // Commented out temporarily to fix startup

  const httpServer = createServer(app);
  
  return httpServer;
}
