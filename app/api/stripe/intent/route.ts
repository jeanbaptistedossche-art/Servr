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
    const { amount, offerteNummer, stripeAccountId, isPanic, boekingId } = await req.json();

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });

    // ── Servr fee model ──────────────────────────────────────────────────────
    // Normaal:  klant +5%, vakman -7%  → Servr +12%
    // Panic:    klant +7%, vakman -6%  → Servr +13%  (vakman betaalt minder bij spoed)
    // ────────────────────────────────────────────────────────────────────────
    const CLIENT_FEE_PCT = isPanic ? 0.07 : 0.05;   // 7% spoed / 5% normaal
    const VAKMAN_FEE_PCT = isPanic ? 0.06 : 0.07;   // 6% spoed / 7% normaal

    const chargeAmount    = Math.round(amount * (1 + CLIENT_FEE_PCT) * 100);
    const applicationFee  = Math.round(amount * (CLIENT_FEE_PCT + VAKMAN_FEE_PCT) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        offerte: offerteNummer ?? "",
        boeking_id: boekingId ?? "",
        vakman_account: stripeAccountId ?? "",
        vakman_prijs: String(amount),
        is_panic: isPanic ? "1" : "0",
        client_fee_pct: String(CLIENT_FEE_PCT),
        vakman_fee_pct: String(VAKMAN_FEE_PCT),
      },
      description: `Servr betaling — ${offerteNummer ?? ""}`,
      // Stripe Connect: vakman krijgt 93%, Servr houdt 12% (5% van klant + 7% van vakman)
      ...(stripeAccountId ? {
        application_fee_amount: applicationFee,
        transfer_data: { destination: stripeAccountId },
      } : {}),
    });

    // Koppel de intent aan de boeking (server-side, service role)
    if (boekingId && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await admin.from("boekingen").update({ stripe_intent: paymentIntent.id }).eq("id", boekingId);
    }

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
