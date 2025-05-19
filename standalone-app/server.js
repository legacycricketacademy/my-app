import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from this directory
app.use(express.static(__dirname));

// Serve the parent dashboard HTML for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'parent-dashboard.html'));
});

// Start the server on port 5001 (assuming main app is on 5000)
const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Standalone parent dashboard server running at http://localhost:${PORT}`);
});