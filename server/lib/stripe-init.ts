import Stripe from "stripe";

let stripe: Stripe | null = null;
let initialized = false;

export function getStripe(): Stripe | null {
  if (initialized) return stripe;
  
  initialized = true;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  
  if (!apiKey) {
    console.warn("[stripe] Stripe disabled (no STRIPE_SECRET_KEY)");
    return null;
  }
  
  try {
    stripe = new Stripe(apiKey, {
      apiVersion: "2024-12-18.acacia",
    });
    console.log("[stripe] Stripe client initialized");
    return stripe;
  } catch (error) {
    console.error("[stripe] Failed to initialize Stripe client:", error);
    return null;
  }
}

export const stripeReady = !!process.env.STRIPE_SECRET_KEY;
