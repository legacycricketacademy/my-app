const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Server is running',
      port: PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Test endpoint
  if (req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'API is working',
      port: PORT
    }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>My App Server</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 8px; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 My App Server is Running!</h1>
        <div class="status">
          <h2>Server Status: ✅ Online</h2>
          <p><strong>Port:</strong> ${PORT}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
        <h3>Available Endpoints:</h3>
        <div class="endpoint">
          <strong>GET /api/health</strong> - Health check
        </div>
        <div class="endpoint">
          <strong>GET /api/test</strong> - Test endpoint
        </div>
      </div>
    </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 App URL: http://localhost:${PORT}`);
});

module.exports = server;
