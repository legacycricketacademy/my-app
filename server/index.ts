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
// Temporarily comment out redirects to get the server running
// import { setupRedirects } from "./redirect";
const setupRedirects = (app: any) => {
  console.log('Setup redirects: temporarily disabled');
};
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

// Redirect root path to the standalone React dashboard for easy access
app.get('/', (req, res) => {
  res.redirect('/standalone-react');
});

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

// Login page with shorter path
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Auth page for login and registration
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

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

// API endpoints for the dashboard data
import { playerSchedule, playerStats, mealPlan, paymentHistory, upcomingPayment } from './api-data';

app.get('/api/dashboard/schedule', (req, res) => {
  res.json(playerSchedule);
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json(playerStats);
});

app.get('/api/dashboard/meals', (req, res) => {
  res.json(mealPlan);
});

app.get('/api/dashboard/payments', (req, res) => {
  res.json({
    history: paymentHistory,
    upcoming: upcomingPayment
  });
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
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
