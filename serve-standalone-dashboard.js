const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'standalone-parent-dashboard.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Parent dashboard server running at http://localhost:${port}`);
});