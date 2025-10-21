/**
 * This is a server middleware that handles redirects to appropriate dashboard
 * based on user role after login
 */
import { Express } from 'express';

// Helper to check if user is authenticated (supports both Passport and session-based auth)
function isUserAuthenticated(req: any): boolean {
  // Check Passport authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    return true;
  }
  
  // Check session-based authentication
  if (req.session?.userId) {
    // Populate req.user if not already set
    if (!req.user) {
      req.user = {
        id: req.session.userId,
        role: req.session.role || 'parent'
      };
    }
    return true;
  }
  
  return false;
}

export function setupRedirects(app: Express) {
  // Add a middleware to check if user is logged in and redirect accordingly
  app.get('/dashboard', (req, res) => {
    if (!isUserAuthenticated(req)) {
      return res.redirect('/auth');
    }
    
    // Redirect based on user role
    if (req.user.role === 'parent') {
      return res.redirect('/parent');
    } else if (req.user.role === 'coach') {
      return res.redirect('/coach');
    } else if (req.user.role === 'admin') {
      return res.redirect('/admin');
    } else {
      return res.redirect('/');
    }
  });
  
  // Authorization check middleware for role-based routes
  app.use(['/parent/*', '/parent', '/dashboard/parent'], (req, res, next) => {
    if (!isUserAuthenticated(req)) {
      return res.redirect('/auth');
    }
    
    // Special test mode parameter allows viewing regardless of role
    const isTestMode = req.query.view === 'parent';
    
    // Check if the user is a parent or in test mode
    if (req.user.role === 'parent' || isTestMode || req.user.role === 'admin') {
      // Continue to the next middleware/route handler
      // This will now be handled by React Router client-side
      return next();
    }
    
    // For unauthorized users, redirect to the main dashboard
    return res.redirect('/');
  });
  
  // Coach routes
  app.use(['/coach/*', '/coach', '/dashboard/coach'], (req, res, next) => {
    if (!isUserAuthenticated(req)) {
      return res.redirect('/auth');
    }
    
    const isTestMode = req.query.view === 'coach';
    
    if (req.user.role === 'coach' || isTestMode || req.user.role === 'admin') {
      return next();
    }
    
    return res.redirect('/');
  });
  
  // Admin routes
  app.use(['/admin/*', '/admin', '/dashboard/admin'], (req, res, next) => {
    if (!isUserAuthenticated(req)) {
      return res.redirect('/auth');
    }
    
    const isTestMode = req.query.view === 'admin';
    
    if (req.user.role === 'admin' || isTestMode) {
      return next();
    }
    
    return res.redirect('/');
  });
}
