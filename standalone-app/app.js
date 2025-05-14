const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration test page
app.get('/debug-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'debug-register.html'));
});

// Simple API for testing
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

// Mock registration endpoint
app.post('/api/register', (req, res) => {
  const { username, email } = req.body;
  
  // Simple validation
  if (!username || !email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and email are required' 
    });
  }
  
  // Mock validation for existing users
  if (username.includes('coachcoach10') || email.includes('coachcoach10')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username or email already exists' 
    });
  }
  
  // Success response
  res.status(201).json({ 
    success: true, 
    message: 'Registration successful', 
    user: {
      id: Math.floor(Math.random() * 1000),
      username,
      email,
      role: req.body.role || 'coach'
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Standalone app running at http://localhost:${PORT}`);
});