const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Create a basic route for the parent dashboard
app.get('/parent', (req, res) => {
  res.sendFile(path.join(__dirname, 'parent-dashboard.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple parent dashboard server running at http://localhost:${PORT}/parent`);
});