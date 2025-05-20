import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// In ES modules, __dirname is not available, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupStaticRoutes(app: express.Express): void {
  // Serve static files from the dist/public directory
  app.use(express.static('dist/public'));
  
  // Specific routes that should be directly handled by the server, not React
  // These need to be defined BEFORE the catch-all route
  
  // Any other routes not starting with /api/ should be handled by React Router
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Skip specific server-handled routes like /direct-parent and /enhanced-parent
    if (
      req.path === '/direct-parent' || 
      req.path === '/enhanced-parent' || 
      req.path === '/register-now' || 
      req.path === '/verify-email'
    ) {
      return next();
    }
    
    // For ALL other routes, serve the React app
    res.sendFile(path.resolve('./dist/public/index.html'));
  });
}