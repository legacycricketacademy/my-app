import { Router } from 'express';
import { z } from 'zod';
import { PaymentsStore } from '../storage/paymentsStore.js';
import { requireAuth } from '../middleware/authz.js';
import type { CreatePaymentRequest, ListPaymentsParams } from '../types/payments.js';

const r = Router();
const dbg = (...args: any[]) => { 
  if (process.env.DEBUG_AUTH === 'true') console.log('[PAYMENTS]', ...args); 
};

// Initialize store
const paymentsStore = new PaymentsStore();

// Validation schemas
const createPaymentSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['INR', 'USD']).optional().default('INR'),
  method: z.enum(['cash', 'card', 'upi', 'bank']),
  status: z.enum(['paid', 'pending', 'failed', 'refunded']).optional().default('paid'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const listPaymentsSchema = z.object({
  playerId: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// GET /api/payments - List payments
r.get('/', requireAuth, async (req: any, res) => {
  try {
    dbg('PAYMENTS_LIST', { 
      userId: req.user.id, 
      role: req.user.role,
      params: req.query 
    });

    // Validate query parameters
    const validation = listPaymentsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation_failed',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
    }

    const params: ListPaymentsParams = validation.data;
    const payments = await paymentsStore.list(params);

    dbg('PAYMENTS_LIST success', { count: payments.length });

    res.json({
      ok: true,
      data: payments
    });

  } catch (error: any) {
    dbg('PAYMENTS_LIST error', { 
      userId: req.user?.id, 
      error: error.message,
      stack: error.stack 
    });

    res.status(500).json({
      ok: false,
      error: 'list_failed',
      message: error.message || 'Failed to fetch payments'
    });
  }
});

// POST /api/payments - Create payment
r.post('/', requireAuth, async (req: any, res) => {
  try {
    dbg('PAYMENTS_CREATE start', { 
      userId: req.user.id, 
      role: req.user.role,
      payload: req.body 
    });

    // Validate request body
    const validation = createPaymentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation_failed',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
    }

    const data: CreatePaymentRequest = validation.data;

    // Create payment
    const payment = await paymentsStore.create(data, req.user.id);

    dbg('PAYMENTS_CREATE success', { 
      userId: req.user.id, 
      paymentId: payment.id 
    });

    res.status(201).json({
      ok: true,
      data: payment
    });

  } catch (error: any) {
    dbg('PAYMENTS_CREATE error', { 
      userId: req.user?.id, 
      error: error.message,
      stack: error.stack 
    });

    res.status(500).json({
      ok: false,
      error: 'create_failed',
      message: error.message || 'Failed to create payment'
    });
  }
});

export default r;
