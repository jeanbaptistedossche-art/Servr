import { NextRequest, NextResponse } from "next/server";

// POST /api/stripe/connect
// Maakt een Stripe Express account aan + stuurt onboarding link terug.
// Body: { returnUrl: string }
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) {
    return NextResponse.json(
      { error: "Stripe niet geconfigureerd — voeg STRIPE_SECRET_KEY toe in Vercel" },
      { status: 503 }
    );
  }

  try {
    const { returnUrl } = await req.json();

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });

    // Maak Express account aan
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Maak onboarding link aan
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${returnUrl}?stripeRefresh=true`,
      return_url: `${returnUrl}?stripeAccountId=${account.id}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      accountId: account.id,
      url: accountLink.url,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
