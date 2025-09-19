import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files
app.use(express.static(__dirname));

// Serve the simple parent dashboard HTML file
app.get('/parent', (req, res) => {
  res.sendFile(path.join(__dirname, 'simple-parent.html'));
});

// Start the server on dynamic port
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Standalone parent dashboard server running at http://localhost:${PORT}/parent`);
});