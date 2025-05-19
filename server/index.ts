import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { multiTenantStorage } from "./multi-tenant-storage";
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

// Direct, simplified registration that will work properly with the fullName field
app.get('/register-now', (req, res) => {
  res.sendFile('simple-fullname-register.html', { root: './server/public' });
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
        const apiUrl = `http://localhost:5000/api/verify-email?token=${token}`;
        
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
