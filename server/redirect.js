/**
 * This is a server middleware that handles redirects to appropriate dashboard
 * based on user role after login
 */
const path = require('path');

function setupRedirects(app) {
  // Add a middleware to check if user is logged in and redirect accordingly
  app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth');
    }
    
    // Redirect based on user role
    if (req.user.role === 'parent') {
      return res.redirect('/parent');
    } else {
      return res.redirect('/');
    }
  });
  
  // Special routes to ensure parent dashboard is accessible
  app.get('/parent', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth');
    }
    
    // Special test mode parameter
    const isTestMode = req.query.view === 'parent';
    
    // Check if the user is a parent or in test mode
    if (req.user.role === 'parent' || isTestMode) {
      // Serve the parent dashboard HTML file directly
      return res.sendFile(path.resolve(__dirname, 'public/parent-dashboard.html'));
    }
    
    // For non-parent users, redirect to the main dashboard
    return res.redirect('/');
  });
  
  // Also handle the dashboard/parent route
  app.get('/dashboard/parent', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth');
    }
    
    // Special test mode parameter
    const isTestMode = req.query.view === 'parent';
    
    // Check if the user is a parent or in test mode
    if (req.user.role === 'parent' || isTestMode) {
      // Serve the parent dashboard HTML file directly
      return res.sendFile(path.resolve(__dirname, 'public/parent-dashboard.html'));
    }
    
    // For non-parent users, redirect to the main dashboard
    return res.redirect('/');
  });
}

module.exports = { setupRedirects };