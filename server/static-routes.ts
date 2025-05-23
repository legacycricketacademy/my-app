import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// In ES modules, __dirname is not available, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupStaticRoutes(app: express.Express): void {
  // Skip certain routes that are directly handled by the server
  const directServerRoutes = [
    '/api',
    '/direct-parent',
    '/enhanced-parent',
    '/standalone-react',
    '/register-now',
    '/verify-email',
    '/register-debug',
    '/register-simple',
    '/login',
    '/login.html',
    '/auth',
    '/auth.html',
    '/coach',
    '/coach-dashboard',
    '/coaches-pending-approval',
    '/coaches-pending-approval.html',
    '/admin',
    '/admin/coaches'
  ];
  
  // Serve static files from the dist/public directory for all other routes
  app.use((req, res, next) => {
    // For routes specifically handled by the server, don't try to serve static files
    if (directServerRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }
    
    // For all other routes, try to serve static files
    express.static('dist/public')(req, res, next);
  });
  
  // Catch-all route to handle client-side routes (SPA routing)
  app.use((req, res, next) => {
    // Skip API routes and direct server routes
    if (req.path.startsWith('/api/') || 
        directServerRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }
    
    // For all other routes, serve the React app index.html
    res.sendFile(path.resolve('./dist/public/index.html'));
  });
}