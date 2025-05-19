/**
 * This is a server middleware that handles redirects to appropriate dashboard
 * based on user role after login
 */

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
    
    // Serve the index.html file which will run the React app
    return res.sendFile('index.html', { root: './client' });
  });
}

module.exports = { setupRedirects };