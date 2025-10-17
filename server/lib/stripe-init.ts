import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    console.warn("⚠️ Stripe not configured - STRIPE_SECRET_KEY missing");
    return null;
  }
  if (!stripe) {
    stripe = new Stripe(apiKey, {
      apiVersion: "2025-09-30.clover",
    });
    console.log("✅ Stripe initialized");
  }
  return stripe;
}
