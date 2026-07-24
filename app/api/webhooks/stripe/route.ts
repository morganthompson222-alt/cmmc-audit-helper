import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const companyId = session.metadata?.company_id || session.client_reference_id;

    if (companyId) {
      const supabase = createServiceClient();

      // Update payment status
      await supabase
        .from("cmmc_payments")
        .update({ status: "paid" })
        .eq("stripe_session_id", session.id);

      // Update company subscription status
      await supabase
        .from("cmmc_companies")
        .update({ subscription_status: "paid" })
        .eq("id", companyId);
    }
  }

  return NextResponse.json({ received: true });
}
