/**
 * API Routes - Refactored with centralized services
 */

import express, { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { MultiTenantStorage } from './multi-tenant-storage';
import * as authService from './services/auth-service-unified';
import path from 'path';
import cors from 'cors';
import * as WebSocket from 'ws';

// Create storage instance
const storage = new MultiTenantStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS configuration
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Authentication routes
  setupAuthRoutes(app);
  
  // User routes
  setupUserRoutes(app);
  
  // Academy routes
  setupAcademyRoutes(app);
  
  // Player routes
  setupPlayerRoutes(app);
  
  // Coach routes
  setupCoachRoutes(app);
  
  // Payment routes
  setupPaymentRoutes(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time communications
  setupWebSocketServer(httpServer);
  
  return httpServer;
}

/**
 * Authentication route handlers
 */
function setupAuthRoutes(app: Express) {
  // Regular login
  app.post('/api/login', async (req: Request, res: Response) => {
    await authService.handleLogin(req, res, storage);
  });
  
  // Regular registration
  app.post('/api/register', async (req: Request, res: Response) => {
    await authService.handleRegister(req, res, storage);
  });
  
  // Firebase registration
  app.post('/api/auth/register-firebase', async (req: Request, res: Response) => {
    await authService.handleFirebaseAuth(req, res, storage);
  });
  
  // Firebase login/linking
  app.post('/api/auth/link-firebase', async (req: Request, res: Response) => {
    await authService.handleFirebaseAuth(req, res, storage);
  });
  
  // Special case direct registration
  app.post('/api/auth/direct-register', async (req: Request, res: Response) => {
    await authService.handleSpecialCaseRegister(req, res, storage);
  });
  
  // Regular password reset
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    await authService.handlePasswordReset(req, res, storage);
  });
  
  // Special case password reset
  app.post('/api/auth/reset-special-password', async (req: Request, res: Response) => {
    await authService.handleSpecialPasswordReset(req, res, storage);
  });
  
  // Logout
  app.post('/api/logout', async (req: Request, res: Response) => {
    await authService.handleLogout(req, res);
  });
  
  // Get current user
  app.get('/api/user', async (req: Request, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  
  // Check if username or email exists
  app.post('/api/login-or-register-check', async (req: Request, res: Response) => {
    try {
      const { username, email } = req.body;
      
      // If this is a special case email, handle it directly
      if (email && authService.isSpecialEmail(email)) {
        return res.status(200).json({
          exists: true,
          field: 'email',
          message: "This email requires special login. Please use your username and password to log in."
        });
      }
      
      // Check username
      if (username) {
        const userByUsername = await storage.getUserByUsername(username);
        if (userByUsername) {
          return res.status(200).json({
            exists: true,
            field: 'username',
            message: "This username is already registered. Please log in.",
            usesFirebase: !!userByUsername.firebaseUid
          });
        }
      }
      
      // Check email
      if (email) {
        const userByEmail = await storage.getUserByEmail(email);
        if (userByEmail) {
          return res.status(200).json({
            exists: true,
            field: 'email',
            message: "This email is already registered. Please log in.",
            usesFirebase: !!userByEmail.firebaseUid
          });
        }
      }
      
      // Neither exists
      return res.status(200).json({
        exists: false,
        message: "Username and email are available for registration."
      });
    } catch (error) {
      console.error("Error checking username/email:", error);
      res.status(500).json({ message: "An error occurred while checking" });
    }
  });
  
  // CSRF protection
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    if (!req.session) {
      return res.status(500).json({ error: "Session not available" });
    }
    
    // Generate a CSRF token and store it in the session
    const csrfToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    req.session.csrfToken = csrfToken;
    
    res.json({ csrfToken });
  });
}

/**
 * User route handlers
 */
function setupUserRoutes(app: Express) {
  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };
  
  // Middleware to check admin role
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (req.session.role !== 'admin' && req.session.role !== 'superadmin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    next();
  };
  
  // Get user profile
  app.get('/api/profile', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  // Update user profile
  app.patch('/api/profile', requireAuth, async (req: Request, res: Response) => {
    try {
      const { fullName, phone, profileImage } = req.body;
      
      // Create update object with only provided fields
      const updateData = {};
      if (fullName !== undefined) updateData['fullName'] = fullName;
      if (phone !== undefined) updateData['phone'] = phone;
      if (profileImage !== undefined) updateData['profileImage'] = profileImage;
      
      // Update user
      const updatedUser = await storage.updateUser(req.session.userId, updateData);
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Change password
  app.post('/api/change-password', requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Get user
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Special case user
      if (user.email && authService.isSpecialEmail(user.email)) {
        return res.status(403).json({ 
          message: "Password changes are not allowed for this account type. Please contact support."
        });
      }
      
      // Verify current password
      const isPasswordValid = await authService.comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Validate new password
      const passwordValidation = authService.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }
      
      // Hash new password
      const hashedPassword = await authService.hashPassword(newPassword);
      
      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  
  // Admin endpoints for user management
  app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const academyId = req.query.academyId 
        ? parseInt(req.query.academyId as string) 
        : (req.session.academyId || null);
      
      const users = await storage.getAllUsers({ page, limit, academyId });
      const total = await storage.countUsers(academyId);
      
      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
}

/**
 * Academy route handlers
 */
function setupAcademyRoutes(app: Express) {
  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };
  
  // Middleware to check superadmin role
  const requireSuperAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (req.session.role !== 'superadmin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    next();
  };
  
  // Get all academies
  app.get('/api/academies', requireAuth, async (req: Request, res: Response) => {
    try {
      const academies = await storage.getAllAcademies();
      res.json(academies);
    } catch (error) {
      console.error("Error fetching academies:", error);
      res.status(500).json({ message: "Failed to fetch academies" });
    }
  });
  
  // Get academy by ID
  app.get('/api/academies/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const academyId = parseInt(req.params.id);
      const academy = await storage.getAcademy(academyId);
      
      if (!academy) {
        return res.status(404).json({ message: "Academy not found" });
      }
      
      res.json(academy);
    } catch (error) {
      console.error("Error fetching academy:", error);
      res.status(500).json({ message: "Failed to fetch academy" });
    }
  });
  
  // Create academy (superadmin only)
  app.post('/api/academies', requireSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { name, location, contactEmail, contactPhone, address } = req.body;
      
      // Validate required fields
      if (!name || !location) {
        return res.status(400).json({ message: "Name and location are required" });
      }
      
      // Create academy
      const academy = await storage.createAcademy({
        name,
        location,
        contactEmail,
        contactPhone,
        address
      });
      
      res.status(201).json(academy);
    } catch (error) {
      console.error("Error creating academy:", error);
      res.status(500).json({ message: "Failed to create academy" });
    }
  });
  
  // Set current academy context
  app.post('/api/set-academy', requireAuth, async (req: Request, res: Response) => {
    try {
      const { academyId } = req.body;
      
      // Validate academy exists
      if (academyId) {
        const academy = await storage.getAcademy(academyId);
        if (!academy) {
          return res.status(404).json({ message: "Academy not found" });
        }
      }
      
      // Set academy in session
      req.session.academyId = academyId || null;
      
      res.json({ message: "Academy context updated", academyId: req.session.academyId });
    } catch (error) {
      console.error("Error setting academy context:", error);
      res.status(500).json({ message: "Failed to set academy context" });
    }
  });
}

/**
 * Player route handlers
 */
function setupPlayerRoutes(app: Express) {
  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };
  
  // Get all players (coaches/admins can see all, parents only see their own)
  app.get('/api/players', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const role = req.session.role;
      const academyId = req.query.academyId 
        ? parseInt(req.query.academyId as string) 
        : (req.session.academyId || null);
      
      let players = [];
      
      if (role === 'admin' || role === 'superadmin' || role === 'coach') {
        // Admins and coaches can see all players in their academy
        players = await storage.getAllPlayers(academyId);
      } else if (role === 'parent') {
        // Parents can only see their children
        players = await storage.getPlayersByParentId(userId);
      } else {
        return res.status(403).json({ message: "Not authorized to view players" });
      }
      
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });
}

/**
 * Coach route handlers
 */
function setupCoachRoutes(app: Express) {
  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };
  
  // Middleware for admin roles
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (req.session.role !== 'admin' && req.session.role !== 'superadmin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    next();
  };
  
  // Get all coaches
  app.get('/api/coaches', requireAuth, async (req: Request, res: Response) => {
    try {
      const academyId = req.query.academyId 
        ? parseInt(req.query.academyId as string) 
        : (req.session.academyId || null);
      
      const coaches = await storage.getAllCoaches(academyId);
      res.json(coaches);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      res.status(500).json({ message: "Failed to fetch coaches" });
    }
  });
  
  // Approve pending coach (admin only)
  app.post('/api/coaches/:id/approve', requireAdmin, async (req: Request, res: Response) => {
    try {
      const coachId = parseInt(req.params.id);
      
      // Get coach
      const coach = await storage.getUser(coachId);
      
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      if (coach.role !== 'coach') {
        return res.status(400).json({ message: "User is not a coach" });
      }
      
      if (coach.status !== 'pending_approval') {
        return res.status(400).json({ message: "Coach is not pending approval" });
      }
      
      // Approve coach
      const updatedCoach = await storage.updateUser(coachId, {
        status: 'active',
        isApproved: true
      });
      
      // Send approval notification email
      try {
        await sendCoachApprovalEmail(coach.email, coach.fullName);
      } catch (error) {
        console.error("Failed to send coach approval email:", error);
        // Non-critical, continue
      }
      
      res.json(updatedCoach);
    } catch (error) {
      console.error("Error approving coach:", error);
      res.status(500).json({ message: "Failed to approve coach" });
    }
  });
}

/**
 * Payment route handlers
 */
function setupPaymentRoutes(app: Express) {
  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };
  
  // Get all payments for the current user (parents see their children's payments, coaches/admins see assigned payments)
  app.get('/api/payments', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const role = req.session.role;
      const academyId = req.session.academyId || null;
      
      let payments = [];
      
      if (role === 'admin' || role === 'superadmin') {
        // Admins see all payments in their academy
        payments = await storage.getAllPayments(academyId);
      } else if (role === 'coach') {
        // Coaches see payments for their sessions
        payments = await storage.getPaymentsByCoachId(userId);
      } else if (role === 'parent') {
        // Parents see payments for their children
        payments = await storage.getPaymentsByParentId(userId);
      } else {
        return res.status(403).json({ message: "Not authorized to view payments" });
      }
      
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
}

/**
 * WebSocket server for real-time communications
 */
function setupWebSocketServer(server: Server) {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
            
          default:
            console.log('Received unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'welcome', 
      message: 'Connected to Legacy Cricket Academy WebSocket server',
      timestamp: Date.now()
    }));
  });
  
  return wss;
}

/**
 * Send coach approval email
 */
async function sendCoachApprovalEmail(email: string, name: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not set, skipping coach approval email");
    return false;
  }
  
  try {
    // Import email service
    const { sendEmail } = await import('./email');
    
    const subject = "Your Coach Account Has Been Approved";
    const html = `
      <h1>Your Coach Account Has Been Approved</h1>
      <p>Hello ${name},</p>
      <p>Your coach account at Legacy Cricket Academy has been approved. You can now log in and access all coach features.</p>
      <p>Thank you for joining our team!</p>
      <p>Best regards,<br>The Legacy Cricket Academy Team</p>
    `;
    
    await sendEmail({
      to: email,
      from: 'noreply@legacycricketacademy.com',
      subject,
      html
    });
    
    return true;
  } catch (error) {
    console.error("Failed to send coach approval email:", error);
    return false;
  }
}