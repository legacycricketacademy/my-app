// server/lib/stripe.ts
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;
let stripeReady = false;

if (key) {
  try {
    stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    stripeReady = true;
    console.log('✅ Stripe initialized successfully');
  } catch (err) {
    console.error('[Stripe] Init failed:', (err as Error).message);
    stripe = null;
    stripeReady = false;
  }
} else {
  console.warn('⚠️ Stripe not configured - STRIPE_SECRET_KEY missing');
}

export { stripe, stripeReady };
