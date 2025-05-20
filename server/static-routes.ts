import express, { Router } from 'express';
import path from 'path';

export function setupStaticRoutes(app: express.Express): void {
  // Serve static files from the dist/public directory
  app.use(express.static('dist/public'));
  
  // Handle all paths that should be handled by React Router
  const clientRoutes = [
    '/parent',
    '/dashboard/parent',
    '/parent/*',
    '/profile',
    '/auth',
    '/schedule',
    '/announcements',
    '/players',
    '/parent/schedule',
    '/parent/announcements',
    '/parent/fitness',
    '/parent/meal-plans',
    '/parent/performance',
    '/parent/payments',
    '/emergency-logout',
    '/simple-parent',
    '/independent-parent'
  ];
  
  // Create a single route handler for all client routes
  app.get(clientRoutes, (req, res) => {
    // For testing purposes, allow direct access to all routes
    // without requiring authentication
    
    // Let React Router handle the routing by serving index.html
    res.sendFile(path.resolve('./dist/public/index.html'));
  });
  
  // Catch-all route to handle any other client-side routes
  app.get('*', (req, res) => {
    // If the request is for an API endpoint, skip this handler
    if (req.path.startsWith('/api/')) {
      return;
    }
    
    // For all other routes, serve the React app
    res.sendFile(path.resolve('./dist/public/index.html'));
  });
}