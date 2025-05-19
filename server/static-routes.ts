import express, { Router } from 'express';
import path from 'path';

export function setupStaticRoutes(app: express.Express): void {
  // Serve static files from the client/dist directory
  app.use(express.static('client/dist'));
  
  // Handle React Router paths for the parent dashboard
  app.get(['/parent', '/dashboard/parent', '/parent/*'], (req, res) => {
    // Check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.redirect('/auth');
    }
    
    // For any parent routes, let React Router handle the routing
    res.sendFile(path.resolve('./client/dist/index.html'));
  });
  
  // Add other static routes as needed for specific sections
  app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth');
    }
    
    res.sendFile(path.resolve('./client/dist/index.html'));
  });
}