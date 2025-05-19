import express, { Router } from 'express';
import path from 'path';

export function setupStaticRoutes(app: express.Express): void {
  // Serve static files from the client/dist directory
  app.use(express.static('client/dist'));
  
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
    '/emergency-logout'
  ];
  
  // Create a single route handler for all client routes
  app.get(clientRoutes, (req, res) => {
    // For routes that require authentication
    const publicRoutes = ['/auth', '/emergency-logout'];
    if (!publicRoutes.includes(req.path) && !req.isAuthenticated()) {
      return res.redirect('/auth');
    }
    
    // Let React Router handle the routing by serving index.html
    res.sendFile(path.resolve('./client/dist/index.html'));
  });
  
  // Catch-all route to handle any other client-side routes
  app.get('*', (req, res) => {
    // If the request is for an API endpoint, skip this handler
    if (req.path.startsWith('/api/')) {
      return;
    }
    
    // For all other routes, serve the React app
    res.sendFile(path.resolve('./client/dist/index.html'));
  });
}