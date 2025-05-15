// A minimal Express server that only handles form-based registration
// This can be used as a fallback if the main server has issues
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');
const util = require('util');
const scrypt = util.promisify(crypto.scrypt);
const randomBytes = util.promisify(crypto.randomBytes);

// Create the Express app
const app = express();
const port = process.env.PORT || 3001; // Use a different port from the main server

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Hash password function
async function hashPassword(password) {
  const salt = (await randomBytes(16)).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${derivedKey.toString('hex')}.${salt}`;
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Minimal Registration Form</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem; }
          h1 { color: #4c1d95; }
          form { margin-top: 1rem; }
          .form-group { margin-bottom: 1rem; }
          label { display: block; margin-bottom: 0.25rem; font-weight: bold; }
          input, select { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.25rem; }
          button { background-color: #4c1d95; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Minimal Registration</h1>
        <form action="/register" method="POST">
          <div class="form-group">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required value="admin123admin123">
          </div>
          <div class="form-group">
            <label for="fullName">Full Name:</label>
            <input type="text" id="fullName" name="fullName" required value="Test User">
          </div>
          <div class="form-group">
            <label for="role">Role:</label>
            <select id="role" name="role">
              <option value="coach">Coach</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <button type="submit">Register</button>
        </form>
      </body>
    </html>
  `);
});

// Handle registration
app.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { username, email, password, fullName, role = 'coach' } = req.body;
    
    // Validate inputs
    if (!username || !email || !password || !fullName) {
      return res.send(`
        <html>
          <head><title>Registration Error</title></head>
          <body>
            <h1>Registration Error</h1>
            <p>All fields are required.</p>
            <a href="/">Go Back</a>
          </body>
        </html>
      `);
    }
    
    // Check if username exists
    const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      return res.send(`
        <html>
          <head><title>Registration Error</title></head>
          <body>
            <h1>Registration Error</h1>
            <p>Username "${username}" is already taken.</p>
            <a href="/">Go Back</a>
          </body>
        </html>
      `);
    }
    
    // Check if email exists
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.send(`
        <html>
          <head><title>Registration Error</title></head>
          <body>
            <h1>Registration Error</h1>
            <p>Email "${email}" is already registered.</p>
            <a href="/">Go Back</a>
          </body>
        </html>
      `);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert user
    const status = role === 'coach' ? 'pending' : 'active';
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, "fullName", role, status, "academyId") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [username, email, hashedPassword, fullName, role, status, 1]
    );
    
    // Return success
    console.log('User created:', {
      id: newUser.rows[0].id,
      username: newUser.rows[0].username,
      email: newUser.rows[0].email
    });
    
    return res.send(`
      <html>
        <head>
          <title>Registration Successful</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem; }
            h1 { color: #4c1d95; }
            .success { background-color: #ecfdf5; padding: 1rem; border-radius: 0.5rem; border: 1px solid #a7f3d0; }
          </style>
        </head>
        <body>
          <h1>Registration Successful</h1>
          <div class="success">
            <p>Your account has been created successfully.</p>
            <p>Username: ${newUser.rows[0].username}</p>
            <p>Email: ${newUser.rows[0].email}</p>
            <p>Role: ${newUser.rows[0].role}</p>
          </div>
          <p><a href="/">Register Another</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Registration error:', error);
    return res.send(`
      <html>
        <head><title>Registration Error</title></head>
        <body>
          <h1>Server Error</h1>
          <p>An error occurred during registration: ${error.message}</p>
          <a href="/">Go Back</a>
        </body>
      </html>
    `);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Minimal registration server running at http://localhost:${port}`);
});