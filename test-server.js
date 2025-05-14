import express from 'express';
const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Simple home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Server</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        h1 { color: #444; }
        .btn { display: inline-block; background: #4338ca; color: white; padding: 10px 15px; 
               text-decoration: none; border-radius: 4px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>Test Server</h1>
      <div class="card">
        <h2>Registration Test</h2>
        <p>Test the registration API with our form.</p>
        <a href="/register" class="btn">Open Registration Form</a>
      </div>
    </body>
    </html>
  `);
});

// Registration form
app.get('/register', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Registration Test</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        h1 { color: #444; }
        label { display: block; margin-bottom: 5px; }
        input, select { width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #4338ca; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .error { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 4px; margin-bottom: 15px; display: none; }
        a { color: #4338ca; text-decoration: none; display: inline-block; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <a href="/">← Back to Home</a>
      <h1>Registration Test</h1>
      
      <div class="card">
        <h2>Registration Form</h2>
        <div id="error-message" class="error"></div>
        
        <form id="registration-form">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" value="coachcoach20000" required>
          
          <label for="email">Email</label>
          <input type="email" id="email" name="email" value="coachcoach20000@yahoo.com" required>
          
          <label for="password">Password</label>
          <input type="password" id="password" name="password" value="Cricket2025!" required>
          
          <label for="fullName">Full Name</label>
          <input type="text" id="fullName" name="fullName" value="Test Coach" required>
          
          <label for="role">Role</label>
          <select id="role" name="role">
            <option value="coach">Coach</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
          
          <label for="phone">Phone (optional)</label>
          <input type="text" id="phone" name="phone" value="555-123-4567">
          
          <button type="submit">Register</button>
        </form>
        
        <h3>Response:</h3>
        <pre id="response-output">No response yet</pre>
      </div>
      
      <script>
        document.getElementById('registration-form').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const errorElement = document.getElementById('error-message');
          errorElement.style.display = 'none';
          
          const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            fullName: document.getElementById('fullName').value,
            role: document.getElementById('role').value,
            phone: document.getElementById('phone').value
          };
          
          const responseOutput = document.getElementById('response-output');
          responseOutput.innerText = 'Submitting...';
          
          fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          })
          .then(function(response) {
            return response.json();
          })
          .then(function(result) {
            responseOutput.innerText = JSON.stringify(result, null, 2);
            
            if (!result.success) {
              errorElement.innerText = result.message || 'Registration failed';
              errorElement.style.display = 'block';
            }
          })
          .catch(function(error) {
            responseOutput.innerText = 'Error: ' + error.message;
            
            errorElement.innerText = 'An error occurred: ' + error.message;
            errorElement.style.display = 'block';
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Mock registration API
app.post('/api/register', (req, res) => {
  const { username, email } = req.body;
  
  // Display what we received
  console.log('Registration request received:', req.body);
  
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
  console.log(`Test server running at http://localhost:${PORT}`);
});