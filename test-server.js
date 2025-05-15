// Ultra-simple registration server
// Run with: node test-server.js

const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');
const util = require('util');

// Create app
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection (using DATABASE_URL from environment)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Password hashing utilities
const scryptAsync = util.promisify(crypto.scrypt);
const randomBytesAsync = util.promisify(crypto.randomBytes);

async function hashPassword(password) {
  const salt = (await randomBytesAsync(16)).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${derivedKey.toString('hex')}.${salt}`;
}

// Serve registration form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Registration</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
        label { display: block; margin-top: 10px; }
        input, select { width: 100%; padding: 8px; margin-top: 5px; }
        button { margin-top: 15px; padding: 10px; background: #4c1d95; color: white; border: none; }
        .error { color: red; }
        .success { color: green; background: #f0fff4; padding: 10px; border: 1px solid #a7f3d0; }
      </style>
    </head>
    <body>
      <h1>Test Registration Server</h1>
      <form method="post" action="/register">
        <label>
          Username:
          <input name="username" required>
        </label>
        <label>
          Email:
          <input name="email" type="email" required>
        </label>
        <label>
          Password:
          <input name="password" type="password" value="admin123admin123" required>
        </label>
        <label>
          Full Name:
          <input name="fullName" value="Test User" required>
        </label>
        <label>
          Role:
          <select name="role">
            <option value="coach">Coach</option>
            <option value="parent">Parent</option>
          </select>
        </label>
        <label>
          Phone: (Optional)
          <input name="phone">
        </label>
        <button type="submit">Register</button>
      </form>
    </body>
    </html>
  `);
});

// Registration handler
app.post('/register', async (req, res) => {
  try {
    console.log('Test registration request received:', req.body);
    
    const { username, email, password, fullName, role = 'coach', phone = '' } = req.body;
    
    // Validation
    if (!username || !email || !password || !fullName) {
      return res.send(`
        <html>
        <head>
          <title>Registration Error</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
            .error { color: red; background: #fee2e2; padding: 10px; border: 1px solid #f87171; }
            a { color: #4c1d95; }
          </style>
        </head>
        <body>
          <h1>Registration Error</h1>
          <div class="error">
            <p>All required fields must be provided.</p>
          </div>
          <p><a href="/">← Go Back</a></p>
        </body>
        </html>
      `);
    }
    
    // Check existing username
    const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameCheck.rowCount > 0) {
      return res.send(`
        <html>
        <head>
          <title>Registration Error</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
            .error { color: red; background: #fee2e2; padding: 10px; border: 1px solid #f87171; }
            a { color: #4c1d95; }
          </style>
        </head>
        <body>
          <h1>Registration Error</h1>
          <div class="error">
            <p>Username "${username}" is already registered.</p>
          </div>
          <p><a href="/">← Go Back</a></p>
        </body>
        </html>
      `);
    }
    
    // Check existing email
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rowCount > 0) {
      return res.send(`
        <html>
        <head>
          <title>Registration Error</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
            .error { color: red; background: #fee2e2; padding: 10px; border: 1px solid #f87171; }
            a { color: #4c1d95; }
          </style>
        </head>
        <body>
          <h1>Registration Error</h1>
          <div class="error">
            <p>Email "${email}" is already registered.</p>
          </div>
          <p><a href="/">← Go Back</a></p>
        </body>
        </html>
      `);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Determine status based on role
    const status = role === 'coach' ? 'pending' : 'active';
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, email, password, "fullName", role, status, phone, "academyId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [username, email, hashedPassword, fullName, role, status, phone, 1]
    );
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to create user record');
    }
    
    const user = result.rows[0];
    
    console.log('Test registration successful:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    // Return success page
    return res.send(`
      <html>
      <head>
        <title>Registration Successful</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
          h1 { color: #4c1d95; }
          .success { color: #166534; background: #dcfce7; padding: 10px; border: 1px solid #4ade80; }
          .details { background: #f9fafb; padding: 10px; margin-top: 15px; }
          a { color: #4c1d95; }
        </style>
      </head>
      <body>
        <h1>Registration Successful!</h1>
        <div class="success">
          <p>Your account has been created successfully.</p>
        </div>
        
        <div class="details">
          <h2>Account Details</h2>
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <p><strong>Status:</strong> ${user.status}</p>
        </div>
        
        <p><a href="/">← Register Another Account</a></p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Test registration error:', error);
    
    return res.send(`
      <html>
      <head>
        <title>Registration Error</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
          .error { color: red; background: #fee2e2; padding: 10px; border: 1px solid #f87171; }
          pre { background: #f1f5f9; padding: 10px; overflow: auto; }
          a { color: #4c1d95; }
        </style>
      </head>
      <body>
        <h1>Server Error</h1>
        <div class="error">
          <p>Registration failed: ${error.message}</p>
        </div>
        <pre>${error.stack}</pre>
        <p><a href="/">← Go Back</a></p>
      </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Test registration server running at http://localhost:${PORT}`);
  console.log(`Database URL: ${process.env.DATABASE_URL ? 'Configured via environment' : 'Not configured'}`);
});