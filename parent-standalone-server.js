import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve the simple parent dashboard HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'simple-parent.html'));
});

// Start the server on port 5001 (to avoid conflicts with the main app on 5000)
const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Parent dashboard server running at http://localhost:${PORT}`);
});