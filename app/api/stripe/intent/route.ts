import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secretKey     = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                      ?? process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || secretKey === "your_stripe_secret_key" || !secretKey.startsWith("sk_")) {
    return NextResponse.json(
      { error: "Stripe niet geconfigureerd — voeg STRIPE_SECRET_KEY toe in Vercel" },
      { status: 503 }
    );
  }

  try {
    const { amount, offerteNummer, stripeAccountId } = await req.json();

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });

    // Commissie: 10% platform fee voor Servr
    const PLATFORM_FEE_PCT = 0.10;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: { offerte: offerteNummer ?? "", vakman_account: stripeAccountId ?? "" },
      description: `Servr betaling — ${offerteNummer ?? ""}`,
      // Stripe Connect: stuur 90% naar vakman, 10% blijft bij Servr
      ...(stripeAccountId ? {
        application_fee_amount: Math.round(amount * PLATFORM_FEE_PCT * 100),
        transfer_data: { destination: stripeAccountId },
      } : {}),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: publishableKey ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
