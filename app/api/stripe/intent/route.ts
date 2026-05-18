import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey === "your_stripe_secret_key") {
    return NextResponse.json(
      { error: "Stripe niet geconfigureerd" },
      { status: 503 }
    );
  }

  try {
    const { amount, offerteNummer } = await req.json();

    // Dynamisch importeren zodat het niet crasht zonder Stripe key
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // eurocent
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: { offerte: offerteNummer ?? "" },
      description: `Servr betaling — ${offerteNummer ?? ""}`,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
