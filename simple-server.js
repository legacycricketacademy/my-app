// Simple standalone server for registration
// Run with: node simple-server.js
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');
const util = require('util');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection (using environment variable if available)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

// Hash password utilities
const scryptAsync = util.promisify(crypto.scrypt);
const randomBytesAsync = util.promisify(crypto.randomBytes);

async function hashPassword(password) {
  const salt = (await randomBytesAsync(16)).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${derivedKey.toString('hex')}.${salt}`;
}

// Serve landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simple Registration Server</title>
      <style>
        body {
          font-family: -apple-system, system-ui, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 { color: #4c1d95; }
        form {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input, select {
          width: 100%;
          padding: 8px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        button {
          background: #4c1d95;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        .help {
          color: #666;
          font-size: 14px;
          margin-top: -10px;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <h1>Cricket Academy Registration</h1>
      <p>Simple standalone registration server</p>
      
      <form action="/register" method="POST">
        <div>
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" required>
          <div class="help">Choose a unique username</div>
        </div>
        
        <div>
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required>
        </div>
        
        <div>
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" value="admin123admin123" required>
        </div>
        
        <div>
          <label for="fullName">Full Name:</label>
          <input type="text" id="fullName" name="fullName" value="Test User" required>
        </div>
        
        <div>
          <label for="role">Role:</label>
          <select id="role" name="role">
            <option value="coach">Coach</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        
        <div>
          <label for="phone">Phone (Optional):</label>
          <input type="tel" id="phone" name="phone">
          <div class="help">Leave empty to avoid conflicts</div>
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
    
    const { username, email, password, fullName, role = 'coach', phone = '' } = req.body;
    
    // Validation
    if (!username || !email || !password || !fullName) {
      return res.status(400).send(`
        <h1>Registration Error</h1>
        <p>All required fields must be provided</p>
        <a href="/">Go Back</a>
      `);
    }
    
    // Check if username exists
    const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameCheck.rowCount > 0) {
      return res.status(400).send(`
        <h1>Registration Error</h1>
        <p>Username "${username}" is already taken</p>
        <a href="/">Go Back</a>
      `);
    }
    
    // Check if email exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rowCount > 0) {
      return res.status(400).send(`
        <h1>Registration Error</h1>
        <p>Email "${email}" is already registered</p>
        <a href="/">Go Back</a>
      `);
    }
    
    // Check if phone exists (if provided)
    if (phone) {
      const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (phoneCheck.rowCount > 0) {
        return res.status(400).send(`
          <h1>Registration Error</h1>
          <p>Phone "${phone}" is already registered</p>
          <a href="/">Go Back</a>
        `);
      }
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Determine status
    const status = role === 'coach' ? 'pending' : 'active';
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, email, password, "fullName", role, status, phone, "academyId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [username, email, hashedPassword, fullName, role, status, phone, 1]
    );
    
    console.log('User created successfully:', {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email
    });
    
    // Return success page
    return res.status(201).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Successful</title>
        <style>
          body {
            font-family: -apple-system, system-ui, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #4c1d95; }
          .success {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .details {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 5px;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            background: #4c1d95;
            color: white;
            text-decoration: none;
            padding: 10px 15px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <h1>Registration Successful!</h1>
        
        <div class="success">
          <p>Your account has been created successfully.</p>
          <p>You can now use your credentials to log in to the system.</p>
        </div>
        
        <div class="details">
          <h2>Account Details</h2>
          <p><strong>Username:</strong> ${result.rows[0].username}</p>
          <p><strong>Email:</strong> ${result.rows[0].email}</p>
          <p><strong>Role:</strong> ${result.rows[0].role}</p>
          <p><strong>Status:</strong> ${result.rows[0].status}</p>
        </div>
        
        <a href="/">Register Another User</a>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Registration error:', error);
    
    return res.status(500).send(`
      <h1>Server Error</h1>
      <p>Registration failed: ${error.message}</p>
      <a href="/">Go Back</a>
    `);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple registration server running at http://localhost:${PORT}`);
});