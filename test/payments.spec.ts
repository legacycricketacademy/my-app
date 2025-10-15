/**
 * Payments API Tests
 * Tests the payments CRUD operations and reminder functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';

// Create a test server with payments endpoints
const app = express();
app.use(express.json());

let payments: any[] = [
  {
    id: 1,
    playerId: 1,
    playerName: "John Doe",
    amount: 175,
    status: "pending",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Monthly Training Fee",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    playerId: 2,
    playerName: "Sarah Smith",
    amount: 175,
    status: "paid",
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Monthly Training Fee",
    paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

app.get('/api/payments', (req, res) => {
  res.json(payments);
});

app.post('/api/payments', (req, res) => {
  const { playerId, amount, description, dueDate } = req.body;
  
  if (!playerId || !amount || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newPayment = {
    id: Date.now(),
    playerId: parseInt(playerId),
    playerName: "Player Name", // Would be fetched from player data
    amount: parseFloat(amount),
    status: "pending",
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    description,
    createdAt: new Date().toISOString()
  };
  
  payments.push(newPayment);
  res.status(201).json(newPayment);
});

app.post('/api/payments/:id/remind', (req, res) => {
  const paymentId = req.params.id;
  const payment = payments.find(p => p.id === parseInt(paymentId));
  
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  
  // Mock reminder sending
  console.log(`Sending payment reminder for payment ID: ${paymentId}`);
  
  res.json({ 
    message: 'Payment reminder sent successfully',
    paymentId: parseInt(paymentId)
  });
});

const server = createServer(app);

describe('Payments API', () => {
  beforeEach(() => {
    // Reset payments array
    payments = [
      {
        id: 1,
        playerId: 1,
        playerName: "John Doe",
        amount: 175,
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Monthly Training Fee",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        playerId: 2,
        playerName: "Sarah Smith",
        amount: 175,
        status: "paid",
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Monthly Training Fee",
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
  });

  it('should get all payments', async () => {
    const response = await request(server)
      .get('/api/payments')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('playerName', 'John Doe');
  });

  it('should create a new payment', async () => {
    const newPayment = {
      playerId: 3,
      amount: 200,
      description: "Equipment Fee",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };

    const response = await request(server)
      .post('/api/payments')
      .send(newPayment)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('playerId', 3);
    expect(response.body).toHaveProperty('amount', 200);
    expect(response.body).toHaveProperty('description', 'Equipment Fee');
    expect(response.body).toHaveProperty('status', 'pending');
  });

  it('should return 400 for missing required fields', async () => {
    const incompletePayment = {
      playerId: 3,
      // Missing amount and description
    };

    const response = await request(server)
      .post('/api/payments')
      .send(incompletePayment)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Missing required fields');
  });

  it('should send payment reminder', async () => {
    const response = await request(server)
      .post('/api/payments/1/remind')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Payment reminder sent successfully');
    expect(response.body).toHaveProperty('paymentId', 1);
  });

  it('should return 404 for reminder on non-existent payment', async () => {
    const response = await request(server)
      .post('/api/payments/999/remind')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Payment not found');
  });

  it('should include new payment in GET request after creation', async () => {
    const newPayment = {
      playerId: 4,
      amount: 150,
      description: "Registration Fee"
    };

    // Create payment
    await request(server)
      .post('/api/payments')
      .send(newPayment)
      .expect(201);

    // Get all payments
    const response = await request(server)
      .get('/api/payments')
      .expect(200);

    expect(response.body).toHaveLength(3);
    expect(response.body.some((p: any) => p.description === 'Registration Fee')).toBe(true);
  });
});
