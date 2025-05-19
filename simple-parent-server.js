import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve the direct parent dashboard HTML file
app.get('/parent', (req, res) => {
  res.sendFile(path.join(__dirname, 'direct-parent-dashboard.html'));
});

// Start the server on a different port (3001) to avoid conflicts
const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple parent dashboard server running at http://localhost:${PORT}/parent`);
});