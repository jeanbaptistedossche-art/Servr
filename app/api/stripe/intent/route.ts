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

    // ── Servr fee model ──────────────────────────────────────────────────────
    // amount           = vakman's prijs (wat hij vraagt)
    // CLIENT_FEE       = 5%  → klant betaalt 5% meer (verborgen service fee)
    // VAKMAN_FEE       = 8%  → vakman betaalt 8% commissie aan Servr
    //
    // Klant betaalt:   amount * 1.05
    // Vakman ontvangt: amount * 1.05 - (amount*0.05 + amount*0.08) = amount * 0.92
    // Servr verdient:  amount * 0.05 + amount * 0.08 = amount * 0.13
    // ────────────────────────────────────────────────────────────────────────
    const CLIENT_FEE_PCT = 0.05;   // 5% bovenop voor klant
    const VAKMAN_FEE_PCT = 0.08;   // 8% commissie van vakman

    const chargeAmount    = Math.round(amount * (1 + CLIENT_FEE_PCT) * 100);
    const applicationFee  = Math.round(amount * (CLIENT_FEE_PCT + VAKMAN_FEE_PCT) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        offerte: offerteNummer ?? "",
        vakman_account: stripeAccountId ?? "",
        vakman_prijs: String(amount),
      },
      description: `Servr betaling — ${offerteNummer ?? ""}`,
      // Stripe Connect: vakman krijgt 92%, Servr houdt 13% (5% van klant + 8% van vakman)
      ...(stripeAccountId ? {
        application_fee_amount: applicationFee,
        transfer_data: { destination: stripeAccountId },
      } : {}),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: publishableKey ?? null,
      // Bedragen voor de UI (in euro's)
      chargeAmount:   chargeAmount / 100,
      serviceFee:     Math.round(amount * CLIENT_FEE_PCT * 100) / 100,
      vakmanPrijs:    amount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
