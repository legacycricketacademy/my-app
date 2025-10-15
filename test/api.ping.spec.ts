/**
 * API Ping Test
 * Tests the basic health check endpoint
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';

// Create a test server
const app = express();
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

const server = createServer(app);

describe('API Ping Endpoint', () => {
  it('should return 200 with status ok', async () => {
    const response = await request(server)
      .get('/api/ping')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message', 'Server is running');
    expect(response.body).toHaveProperty('timestamp');
  });
});
