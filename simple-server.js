import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(__dirname));

// Main route - always serve the basic landing page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'basic-landing.html'));
});

// Start server
const PORT = 3333;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running at http://localhost:${PORT}`);
  console.log('This server bypasses the React app and serves a static HTML page');
});