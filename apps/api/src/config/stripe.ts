import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY not set — Stripe features will be unavailable");
}

export const stripe = new Stripe(stripeSecretKey ?? "sk_test_placeholder", {
  apiVersion: "2025-08-27.basil",
});
