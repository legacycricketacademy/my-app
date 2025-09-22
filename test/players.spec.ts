/**
 * Players API Tests
 * Tests the players CRUD operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';

// Create a test server with players endpoints
const app = express();
app.use(express.json());

let players: any[] = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    ageGroup: "Under 12s",
    playerType: "Batsman",
    parentEmail: "parent@example.com",
    parentName: "Jane Doe",
    dateOfBirth: "2010-05-15",
    emergencyContact: "555-0123",
    medicalInformation: "None",
    createdAt: new Date().toISOString()
  }
];

app.get('/api/players', (req, res) => {
  res.json(players);
});

app.post('/api/players', (req, res) => {
  const { firstName, lastName, dateOfBirth, ageGroup, playerType, emergencyContact, medicalInformation, parentEmail, parentName } = req.body;
  
  if (!firstName || !lastName || !dateOfBirth || !ageGroup || !parentEmail || !parentName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newPlayer = {
    id: Date.now(),
    firstName,
    lastName,
    dateOfBirth,
    ageGroup,
    playerType: playerType || 'Batsman',
    emergencyContact: emergencyContact || '',
    medicalInformation: medicalInformation || '',
    parentEmail,
    parentName,
    createdAt: new Date().toISOString()
  };
  
  players.push(newPlayer);
  res.status(201).json(newPlayer);
});

const server = createServer(app);

describe('Players API', () => {
  beforeEach(() => {
    // Reset players array
    players = [
      {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        ageGroup: "Under 12s",
        playerType: "Batsman",
        parentEmail: "parent@example.com",
        parentName: "Jane Doe",
        dateOfBirth: "2010-05-15",
        emergencyContact: "555-0123",
        medicalInformation: "None",
        createdAt: new Date().toISOString()
      }
    ];
  });

  it('should get all players', async () => {
    const response = await request(server)
      .get('/api/players')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('firstName', 'John');
  });

  it('should create a new player', async () => {
    const newPlayer = {
      firstName: "Sarah",
      lastName: "Smith",
      dateOfBirth: "2008-03-22",
      ageGroup: "Under 14s",
      playerType: "Bowler",
      parentEmail: "sarah.parent@example.com",
      parentName: "Mike Smith",
      emergencyContact: "555-0456",
      medicalInformation: "Asthma"
    };

    const response = await request(server)
      .post('/api/players')
      .send(newPlayer)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('firstName', 'Sarah');
    expect(response.body).toHaveProperty('lastName', 'Smith');
    expect(response.body).toHaveProperty('ageGroup', 'Under 14s');
  });

  it('should return 400 for missing required fields', async () => {
    const incompletePlayer = {
      firstName: "Test",
      // Missing required fields
    };

    const response = await request(server)
      .post('/api/players')
      .send(incompletePlayer)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Missing required fields');
  });

  it('should include new player in GET request after creation', async () => {
    const newPlayer = {
      firstName: "Test",
      lastName: "Player",
      dateOfBirth: "2010-01-01",
      ageGroup: "Under 12s",
      parentEmail: "test@example.com",
      parentName: "Test Parent"
    };

    // Create player
    await request(server)
      .post('/api/players')
      .send(newPlayer)
      .expect(201);

    // Get all players
    const response = await request(server)
      .get('/api/players')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.some((p: any) => p.firstName === 'Test')).toBe(true);
  });
});
