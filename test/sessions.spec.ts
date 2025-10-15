/**
 * Sessions API Tests
 * Tests the sessions CRUD operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';

// Create a test server with sessions endpoints
const app = express();
app.use(express.json());

let sessions: any[] = [
  {
    id: 1,
    title: "Batting Practice",
    description: "Focus on technique and timing",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: "Main Ground",
    ageGroup: "Under 12s",
    sessionType: "Training",
    maxAttendees: 20,
    currentAttendees: 15,
    createdAt: new Date().toISOString()
  }
];

app.get('/api/sessions', (req, res) => {
  res.json(sessions);
});

app.post('/api/sessions', (req, res) => {
  const { title, description, startTime, endTime, location, ageGroup, sessionType, maxAttendees } = req.body;
  
  if (!title || !startTime || !endTime || !location || !ageGroup || !sessionType || !maxAttendees) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Validate dates
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  
  if (end <= start) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }
  
  const newSession = {
    id: Date.now(),
    title,
    description: description || '',
    startTime,
    endTime,
    location,
    ageGroup,
    sessionType,
    maxAttendees: parseInt(maxAttendees),
    currentAttendees: 0,
    createdAt: new Date().toISOString()
  };
  
  sessions.push(newSession);
  res.status(201).json(newSession);
});

const server = createServer(app);

describe('Sessions API', () => {
  beforeEach(() => {
    // Reset sessions array
    sessions = [
      {
        id: 1,
        title: "Batting Practice",
        description: "Focus on technique and timing",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        location: "Main Ground",
        ageGroup: "Under 12s",
        sessionType: "Training",
        maxAttendees: 20,
        currentAttendees: 15,
        createdAt: new Date().toISOString()
      }
    ];
  });

  it('should get all sessions', async () => {
    const response = await request(server)
      .get('/api/sessions')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('title', 'Batting Practice');
  });

  it('should create a new session', async () => {
    const newSession = {
      title: "Fitness Session",
      description: "Cardio and strength training",
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      location: "Gym",
      ageGroup: "Under 14s",
      sessionType: "Fitness",
      maxAttendees: 15
    };

    const response = await request(server)
      .post('/api/sessions')
      .send(newSession)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', 'Fitness Session');
    expect(response.body).toHaveProperty('location', 'Gym');
    expect(response.body).toHaveProperty('maxAttendees', 15);
  });

  it('should return 400 for missing required fields', async () => {
    const incompleteSession = {
      title: "Test Session",
      // Missing required fields
    };

    const response = await request(server)
      .post('/api/sessions')
      .send(incompleteSession)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Missing required fields');
  });

  it('should return 400 for invalid date format', async () => {
    const invalidSession = {
      title: "Test Session",
      startTime: "invalid-date",
      endTime: "invalid-date",
      location: "Test Ground",
      ageGroup: "Under 12s",
      sessionType: "Training",
      maxAttendees: 20
    };

    const response = await request(server)
      .post('/api/sessions')
      .send(invalidSession)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid date format');
  });

  it('should return 400 when end time is before start time', async () => {
    const invalidSession = {
      title: "Test Session",
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Before start time
      location: "Test Ground",
      ageGroup: "Under 12s",
      sessionType: "Training",
      maxAttendees: 20
    };

    const response = await request(server)
      .post('/api/sessions')
      .send(invalidSession)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'End time must be after start time');
  });

  it('should include new session in GET request after creation', async () => {
    const newSession = {
      title: "Test Session",
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      location: "Test Ground",
      ageGroup: "Under 12s",
      sessionType: "Training",
      maxAttendees: 20
    };

    // Create session
    await request(server)
      .post('/api/sessions')
      .send(newSession)
      .expect(201);

    // Get all sessions
    const response = await request(server)
      .get('/api/sessions')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.some((s: any) => s.title === 'Test Session')).toBe(true);
  });
});
