import express, { Router } from 'express';
import { getStripe } from './lib/stripe-init.js';
import { paymentsStore } from './storage/paymentsStore.js';
import { requireAuth } from './middleware/authz.js';

const router = Router();

const dbg = (...args: any[]) => { 
  if (process.env.DEBUG_AUTH === 'true') console.log('[STRIPE]', ...args); 
};

// POST /api/stripe/payment-intents - Create PaymentIntent
router.post('/payment-intents', requireAuth, async (req: any, res) => {
  try {
    dbg('PAYMENT_INTENT_CREATE start', { 
      userId: req.user?.id, 
      role: req.user?.role,
      body: req.body 
    });

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        ok: false,
        error: 'stripe_not_configured',
        message: 'Payment processing is not available'
      });
    }

    const { amount, currency = 'inr', playerId, description } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'invalid_amount',
        message: 'Amount must be a positive number'
      });
    }

    if (!playerId) {
      return res.status(400).json({
        ok: false,
        error: 'missing_player_id',
        message: 'Player ID is required'
      });
    }

    // Convert amount to minor units (paise for INR)
    const amountInMinorUnits = Math.round(amount * 100);

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInMinorUnits,
      currency: currency.toLowerCase(),
      metadata: {
        playerId: String(playerId),
        createdBy: String(req.user.id),
        description: description || 'Cricket Academy Payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    dbg('PAYMENT_INTENT_CREATE success', { 
      paymentIntentId: paymentIntent.id,
      amount: amountInMinorUnits,
      currency: currency 
    });

    res.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    dbg('PAYMENT_INTENT_CREATE error', { 
      error: error instanceof Error ? error.message : 'unknown',
      userId: req.user?.id 
    });

    res.status(500).json({
      ok: false,
      error: 'payment_intent_failed',
      message: error instanceof Error ? error.message : 'Failed to create payment intent'
    });
  }
});

// POST /api/stripe/webhook - Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      console.error('[STRIPE] Webhook received but Stripe not configured');
      return res.status(503).json({ ok: false, error: 'stripe_not_configured' });
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[STRIPE] Webhook secret not configured');
      return res.status(500).json({ ok: false, error: 'webhook_not_configured' });
    }

    // Get raw body for signature verification
    const rawBody = req.body;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('[STRIPE] Webhook signature verification failed:', err);
      return res.status(400).json({ ok: false, error: 'invalid_signature' });
    }

    dbg('WEBHOOK_RECEIVED', { type: event.type, id: event.id });

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        dbg('PAYMENT_SUCCEEDED', { 
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        });

        // Create payment record in our store
        const paymentData = {
          id: `stripe_${paymentIntent.id}`,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert back from minor units
          currency: paymentIntent.currency.toUpperCase(),
          status: 'completed',
          method: paymentIntent.payment_method_types?.[0] || 'card',
          playerId: paymentIntent.metadata.playerId,
          createdBy: paymentIntent.metadata.createdBy,
          createdAt: new Date().toISOString(),
          reference: paymentIntent.id,
          notes: paymentIntent.metadata.description || 'Stripe Payment'
        };

        await paymentsStore.create(paymentData, { id: paymentIntent.metadata.createdBy, role: 'parent' });
        
        dbg('PAYMENT_STORED', { paymentId: paymentData.id });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        dbg('PAYMENT_FAILED', { 
          paymentIntentId: paymentIntent.id,
          lastPaymentError: paymentIntent.last_payment_error
        });

        // Create failed payment record
        const paymentData = {
          id: `stripe_${paymentIntent.id}_failed`,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: 'failed',
          method: 'card',
          playerId: paymentIntent.metadata.playerId,
          createdBy: paymentIntent.metadata.createdBy,
          createdAt: new Date().toISOString(),
          reference: paymentIntent.id,
          notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
        };

        await paymentsStore.create(paymentData, { id: paymentIntent.metadata.createdBy, role: 'parent' });
        
        dbg('FAILED_PAYMENT_STORED', { paymentId: paymentData.id });
        break;
      }

      default:
        dbg('UNHANDLED_WEBHOOK', { type: event.type });
    }

    res.json({ ok: true, received: true });

  } catch (error) {
    console.error('[STRIPE] Webhook error:', error);
    res.status(500).json({
      ok: false,
      error: 'webhook_processing_failed',
      message: error instanceof Error ? error.message : 'Webhook processing failed'
    });
  }
});

export default router;
