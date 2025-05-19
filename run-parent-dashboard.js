const express = require('express');
const path = require('path');

const app = express();

// Serve the parent-dashboard.html file directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'parent-dashboard.html'));
});

// Start server on port 3001 to avoid conflicts
const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Parent dashboard running at http://localhost:${PORT}`);
});