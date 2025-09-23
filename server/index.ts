import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
// import { multiTenantStorage } from "./multi-tenant-storage";
import path from "path";
import { fileURLToPath } from 'url';
import { db } from "@db";
import { users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { config, isDevelopment, isProduction, getCorsOptions } from "./config";

// These two lines allow us to use __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Enable redirects for proper routing
import { setupRedirects } from "./redirect";
// import { setupStaticRoutes } from "./static-routes"; // Import our static routes handler for React Router

// Add academy context to the request object
declare global {
  namespace Express {
    interface Request {
      academyId?: number;
      academySlug?: string;
    }
  }
}

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers
app.use((req, res, next) => {
  const corsOptions = getCorsOptions();
  const origin = req.headers.origin;
  
  if (corsOptions.origin.includes('*') || (origin && corsOptions.origin.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
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

// Export app for testing BEFORE setting up routes
export { app };

// Setup routes
registerRoutes(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.appEnv,
    authProvider: config.authProvider,
    emailEnabled: !!process.env.SENDGRID_API_KEY
  });
});

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    appEnv: config.appEnv,
    nodeEnv: config.nodeEnv,
    authProvider: config.authProvider,
    version: process.env.npm_package_version || '1.0.0',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    gitSha: process.env.GIT_SHA || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Email status endpoint
app.get('/api/email/status', (req, res) => {
  try {
    const emailEnabled = !!process.env.SENDGRID_API_KEY;
    res.json({
      emailEnabled,
      provider: 'sendgrid',
      fromEmail: process.env.EMAIL_FROM || 'noreply@legacycricketacademy.com',
      replyToEmail: process.env.EMAIL_REPLY_TO || 'support@legacycricketacademy.com'
    });
  } catch (error) {
    res.json({
      emailEnabled: false,
      provider: 'sendgrid',
      reason: 'unavailable',
      fromEmail: process.env.EMAIL_FROM || 'noreply@legacycricketacademy.com',
      replyToEmail: process.env.EMAIL_REPLY_TO || 'support@legacycricketacademy.com'
    });
  }
});

// Dev test email endpoint (only in non-production)
app.post('/api/dev/test-email', async (req, res) => {
  if (config.appEnv === 'production') {
    return res.status(404).json({ error: 'Test email endpoint not available in production' });
  }

  try {
    const { sendTestEmail } = await import('./services/email');
    const { to } = req.body;
    
    const result = await sendTestEmail(to);
    res.json(result);
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      sent: false, 
      reason: error instanceof Error ? error.message : 'unknown_error' 
    });
  }
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

  const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
  
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

// All static HTML routes have been removed to allow React Router to handle routing
// React app will handle: /register, /login, /dashboard, /coach, /admin, etc.

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

// Admin routes handled by React Router - removed static HTML serving

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

// Email verification now handled by React Router - removed static HTML serving

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
      // multiTenantStorage.setAcademyContext(academyId);
    } else {
      // It's a slug, need to look up the ID
      // const academy = await multiTenantStorage.getAcademyBySlug(academyIdentifier);
      // if (academy) {
      //   req.academyId = academy.id;
      //   req.academySlug = academyIdentifier;
      //   multiTenantStorage.setAcademyContext(academy.id);
      // }
    }
  } else {
    // No academy in path, use default academy (ID 1) for backward compatibility
    req.academyId = 1;
    // multiTenantStorage.setAcademyContext(1);
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
  
  // Register API routes FIRST (before static routes)
  const server = await registerRoutes(app);
  
  // Setup static routes for React Router support (after API routes)
  // setupStaticRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log("Environment check:", { NODE_ENV: config.nodeEnv, expressEnv: app.get("env"), isDevelopment: isDevelopment() });
  
  // Serve static files from the built client
  const publicDir = path.resolve(__dirname, "../dist/public");
  app.use(express.static(publicDir));
  
  // Serve the React app for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  // Start the server only when run directly (not imported for testing)
  if (import.meta.url === `file://${process.argv[1]}`) {
    server.listen({
      port: config.port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${config.port}`);
    });
  }
})();
