import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return stripeInstance;
}

export function getStripePriceId(): string {
  return process.env.STRIPE_PRICE_ID || "";
}

export const STRIPE_AMOUNT = 100000; // £1000 in pence
