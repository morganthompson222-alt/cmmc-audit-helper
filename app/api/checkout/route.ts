import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getStripePriceId, STRIPE_AMOUNT } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user's company
    const { data: companies } = await supabase
      .from("cmmc_companies")
      .select("id, name, subscription_status")
      .eq("owner_user_id", user.id)
      .limit(1);

    if (!companies?.[0]) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const company = companies[0];

    if (company.subscription_status === "paid") {
      return NextResponse.json({ url: "/export" });
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: getStripePriceId(),
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/export?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/export`,
      client_reference_id: company.id,
      metadata: {
        company_id: company.id,
      },
    });

    // Record pending payment
    await supabase.from("cmmc_payments").insert({
      company_id: company.id,
      stripe_session_id: session.id,
      amount: STRIPE_AMOUNT,
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
