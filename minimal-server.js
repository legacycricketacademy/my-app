import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Using a different port

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve the minimal HTML file for all routes
app.get('*', (req, res) => {
  console.log('Serving minimal.html page...');
  res.sendFile(path.join(__dirname, 'minimal.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running at http://localhost:${PORT}`);
});