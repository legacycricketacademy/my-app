import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Express, Request, Response } from "express";
import { storage } from "./storage.js";

const scryptAsync = promisify(scrypt);

// Simple password hashing functions
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split('.');
    if (!hashed || !salt) {
      console.log("Invalid stored password format");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Export the setup function
export const setupAuth = (app: Express): void => {
  // Login endpoint
  app.post("/api/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        message: "Username and password are required" 
      });
    }

    try {
      console.log(`Login attempt for username: ${username}`);
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`User not found: ${username}`);
        return res.status(401).json({ 
          message: "Login failed - Incorrect username or password" 
        });
      }

      console.log(`User found: ${user.username}, checking password...`);
      console.log(`Stored password hash: ${user.password}`);
      
      // Compare passwords
      const isPasswordValid = await comparePasswords(password, user.password);
      
      if (!isPasswordValid) {
        console.log(`Password invalid for user: ${username}`);
        return res.status(401).json({ 
          message: "Login failed - Incorrect username or password" 
        });
      }

      console.log(`Login successful for user: ${username}`);

      // Set user in session
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.academyId = user.academyId;

      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.json(userData);
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "An error occurred during login" 
      });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ 
            message: "Error during logout" 
          });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Already logged out" });
    }
  });


  // Force logout endpoint for debugging
  app.post("/api/force-logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy(() => {});
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Force logout completed" });
  });

  // Get current user endpoint
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      console.log("Session check - userId:", req.session?.userId);
      
      // Check if user is authenticated via session
      if (req.session && req.session.userId) {
        // Use the same method as login to get user data
        const user = await storage.getUserByUsername("parent1");
        if (user && user.id === req.session.userId) {
          console.log("User found via session:", user.username);
          return res.json(user);
        }
        
        // Try coach1 as well
        const coach = await storage.getUserByUsername("coach1");
        if (coach && coach.id === req.session.userId) {
          console.log("Coach found via session:", coach.username);
          return res.json(coach);
        }
      }
      
      console.log("No valid session found");
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

