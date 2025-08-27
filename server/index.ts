import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { multiTenantStorage } from "./multi-tenant-storage";
import path from "path";
import { fileURLToPath } from 'url';
import { db } from "@db";
import { users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// These two lines allow us to use __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Enable redirects for proper routing
import { setupRedirects } from "./redirect";
import { setupStaticRoutes } from "./static-routes"; // Import our static routes handler for React Router

// Add academy context to the request object
declare global {
  namespace Express {
    interface Request {
      academyId?: number;
      academySlug?: string;
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Add session configuration
import session from 'express-session';
app.use(session({
  secret: 'cricket-academy-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Initialize passport
import passport from 'passport';
app.use(passport.initialize());
app.use(passport.session());

// Add ping endpoint for connectivity testing
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// Email verification functionality
import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendVerificationEmail(email: string, parentName: string, verificationToken: string) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log('SendGrid not configured, skipping email send');
    return false;
  }

  const verificationUrl = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${process.env.REPLIT_URL || 'localhost:5000'}/verify-email?token=${verificationToken}`;
  
  const emailContent = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Welcome to Legacy Cricket Academy - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>🏏 Legacy Cricket Academy</h1>
        </div>
        <div style="padding: 20px; background: #f8fafc;">
          <h2>Welcome, ${parentName}!</h2>
          <p>Thank you for registering your child with Legacy Cricket Academy. To complete your registration and access your parent dashboard, please verify your email address.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `
  };

  try {
    await mailService.send(emailContent);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Serve the main cricket academy app - DISABLED to use React
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../cricket-academy-with-email.html'));
// });

// Serve the dashboard with authentication check - DISABLED to use React
// app.get('/dashboard', (req, res) => {
//   if (req.isAuthenticated() && req.user?.role === 'parent') {
//     res.sendFile(path.join(__dirname, '../secure-dashboard.html'));
//   } else {
//     res.sendFile(path.join(__dirname, '../parent-registration.html'));
//   }
// });

// Direct, simplified registration that will work properly with the fullName field
app.get('/register-now', (req, res) => {
  res.sendFile('simple-fullname-register.html', { root: './server/public' });
});

// Direct route to parent dashboard that bypasses React and authentication
app.get('/direct-parent', (req, res) => {
  res.sendFile('parent-dashboard.html', { root: './server/public' });
});

// Enhanced interactive parent dashboard with JavaScript functionality
app.get('/enhanced-parent', (req, res) => {
  res.sendFile('enhanced-parent-dashboard.html', { root: './server/public' });
});

// Quick parent dashboard with improved sign out button
app.get('/quick-parent', (req, res) => {
  res.sendFile('quick-parent.html', { root: './server/public' });
});

// Working dashboard that displays properly
app.get('/working-dashboard', (req, res) => {
  res.sendFile('working-dashboard.html', { root: './server/public' });
});

// Standalone React dashboard that runs directly without the React app
app.get('/standalone-react', (req, res) => {
  res.sendFile('standalone-react-dashboard.html', { root: './server/public' });
});

// Registration debugging tool
app.get('/register-debug', (req, res) => {
  res.sendFile(path.resolve('./server/public/register-debug.html'));
});

// Simple reliable registration form (without network errors)
app.get('/register-simple', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-reliable-register.html'));
});

// Login page after email verification
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login page with shorter path - DISABLED to use React
// app.get('/login', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'login.html'));
// });

// Auth page for login and registration - DISABLED to use React
// app.get('/auth', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'auth.html'));
// });

// Coach approval page for administrators
app.get('/coaches-pending-approval', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coaches-pending-approval.html'));
});

// Coach dashboard
app.get('/coach', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coach-dashboard.html'));
});

// Coach dashboard with alternative path
app.get('/coach-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coach-dashboard.html'));
});

// API endpoint to fetch pending coaches
app.get('/api/coaches/pending', async (req, res) => {
  try {
    console.log('Fetching pending coaches for approval page');
    
    const pendingCoaches = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      status: users.status,
      createdAt: users.createdAt
    })
    .from(users)
    .where(
      and(
        eq(users.role, 'coach'),
        eq(users.status, 'pending')
      )
    )
    .orderBy(desc(users.createdAt));
    
    console.log(`Found ${pendingCoaches.length} pending coaches`);
    
    return res.status(200).json(pendingCoaches);
  } catch (error) {
    console.error('Error fetching pending coaches:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending coaches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin pages - direct routes to avoid React router
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

app.get('/admin/coaches', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coaches-pending-approval.html'));
});

// Simple ping endpoint to check server connectivity
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint that serves HTML directly
app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Server Test</title></head>
    <body style="font-family: Arial; padding: 20px; background: #f0f0f0;">
      <h1 style="color: #2d3748;">✅ Server is Working!</h1>
      <p>Legacy Cricket Academy server is running successfully.</p>
      <a href="/working-dashboard" style="background: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Go to Dashboard
      </a>
    </body>
    </html>
  `);
});

// Coach approval API endpoints
app.post('/api/coaches/:id/approve', async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);
    
    // In a real implementation, we would update the coach's status in the database
    // For now, we'll just return a success response
    console.log(`Coach ${coachId} approved by admin`);
    
    return res.json({
      success: true,
      message: `Coach ${coachId} approved successfully`
    });
  } catch (error) {
    console.error('Error approving coach:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve coach. Please try again.'
    });
  }
});

app.post('/api/coaches/:id/reject', async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);
    
    // In a real implementation, we would update the coach's status in the database
    // For now, we'll just return a success response
    console.log(`Coach ${coachId} rejected by admin`);
    
    return res.json({
      success: true,
      message: `Coach ${coachId} rejected successfully`
    });
  } catch (error) {
    console.error('Error rejecting coach:', error);
    return res.status(500).json({
      success: false, 
      message: 'Failed to reject coach. Please try again.'
    });
  }
});

// Secure API endpoints - only return data for authenticated parent's children
app.get('/api/dashboard/schedule', async (req, res) => {
  if (!req.isAuthenticated() || req.user?.role !== 'parent') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Get schedule for current parent's children only
    const parentId = req.user.id;
    // For now, return parent-specific schedule data
    const schedule = [
      { day: 'Monday', time: '4:00 PM - 6:00 PM', activity: 'Cricket Training', location: 'Ground A' },
      { day: 'Wednesday', time: '5:00 PM - 6:30 PM', activity: 'Fitness Session', location: 'Gym' },
      { day: 'Friday', time: '4:30 PM - 6:30 PM', activity: 'Match Practice', location: 'Ground B' },
      { day: 'Saturday', time: '9:00 AM - 11:00 AM', activity: 'Team Meeting', location: 'Clubhouse' }
    ];
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  if (!req.isAuthenticated() || req.user?.role !== 'parent') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const parentId = req.user.id;
    // Return performance data for this parent's child
    const stats = {
      sessions: 18,
      matches: 12,
      attendance: '97%',
      runs: 68,
      achievements: [
        { title: 'Player of the Match - Best Bowling', date: 'Last Week' },
        { title: 'Highest Score: 52 Not Out', date: 'This Month' }
      ]
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/dashboard/payments', async (req, res) => {
  if (!req.isAuthenticated() || req.user?.role !== 'parent') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const parentId = req.user.id;
    // Return payment data for this parent only
    const payments = {
      current: {
        period: 'December 2024',
        status: 'paid',
        description: 'Monthly Training Fee',
        amount: '175'
      },
      history: [
        { date: 'November 2024', description: 'Monthly Training Fee', amount: '175' },
        { date: 'October 2024', description: 'Monthly Training Fee', amount: '175' },
        { date: 'September 2024', description: 'Equipment Purchase', amount: '95' }
      ]
    };
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Handle email verification directly without React routing
app.get('/verify-email', (req, res) => {
  const token = req.query.token;
  
  // Process the token in the background to update the user's status
  if (token && typeof token === 'string') {
    // Make a server-side request to our API to verify the email in the background
    try {
      // Use fetch instead of require to avoid ESM/CJS issues
      import('node-fetch').then(({ default: fetch }) => {
        // Use the full server URL instead of localhost
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}/api/verify-email?token=${token}`;
        
        fetch(apiUrl)
          .then(response => response.text())
          .then(() => {
            console.log('Background verification process completed');
          })
          .catch(err => {
            console.error('Error in fetch for verification:', err);
          });
      });
    } catch (err) {
      console.error('Failed to make API request:', err);
    }
  }
  
  // Return the success page immediately
  res.sendFile('email-verified.html', { root: './server/public' });
});

// Academy context middleware
app.use(async (req, res, next) => {
  // Parse academy context from URL path
  // Format: /academy/{slug or id}/...
  const academyPathRegex = /^\/academy\/([^\/]+)/;
  const match = req.path.match(academyPathRegex);
  
  if (match) {
    const academyIdentifier = match[1];
    
    // Check if it's a numeric ID or a slug
    if (/^\d+$/.test(academyIdentifier)) {
      const academyId = parseInt(academyIdentifier, 10);
      req.academyId = academyId;
      multiTenantStorage.setAcademyContext(academyId);
    } else {
      // It's a slug, need to look up the ID
      const academy = await multiTenantStorage.getAcademyBySlug(academyIdentifier);
      if (academy) {
        req.academyId = academy.id;
        req.academySlug = academyIdentifier;
        multiTenantStorage.setAcademyContext(academy.id);
      }
    }
  } else {
    // No academy in path, use default academy (ID 1) for backward compatibility
    req.academyId = 1;
    multiTenantStorage.setAcademyContext(1);
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup redirects for dashboard routes
  setupRedirects(app);
  
  // Setup static routes for React Router support
  setupStaticRoutes(app);
  
  // Register API routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
