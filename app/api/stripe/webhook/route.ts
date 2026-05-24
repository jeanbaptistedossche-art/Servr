import { NextRequest, NextResponse } from "next/server";

/**
 * Stripe webhook handler
 *
 * Vercel: stel in via https://dashboard.stripe.com/webhooks
 * Endpoint URL: https://jouw-app.vercel.app/api/stripe/webhook
 * Events: payment_intent.succeeded
 *
 * Voeg toe in Vercel env vars:
 *   STRIPE_WEBHOOK_SECRET = whsec_...
 */

// Raw body nodig voor Stripe signature verificatie
export const dynamic = "force-dynamic";

// Server-side in-memory store voor notificaties (werkt per deploy instance)
// In productie: vervang door Supabase tabel `notificaties`
type ServerNotificatie = {
  id: string;
  vakmanAccountId: string;
  vakmanTarief: number;
  vakmanOntvangt: number;
  klantBetaald: number;
  offerte: string;
  timestamp: string;
};

const notificatiesMap = new Map<string, ServerNotificatie[]>();

function addServerNotificatie(n: ServerNotificatie) {
  const lijst = notificatiesMap.get(n.vakmanAccountId) ?? [];
  notificatiesMap.set(n.vakmanAccountId, [n, ...lijst].slice(0, 50));
}

// ─── GET /api/stripe/webhook?accountId=acct_xxx ───────────────────────────────
// Hiermee pollt de client voor nieuwe notificaties
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ notificaties: [] });
  }
  const lijst = notificatiesMap.get(accountId) ?? [];
  return NextResponse.json({ notificaties: lijst });
}

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey     = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || !secretKey.startsWith("sk_")) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 503 });
  }

  // Lees raw body (nodig voor signature verificatie)
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: import("stripe").Stripe.Event;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });

    if (webhookSecret && signature) {
      // Productie: verifieer signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Dev/test: parse zonder verificatie
      event = JSON.parse(body) as import("stripe").Stripe.Event;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    console.error("[webhook] signature fout:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ─── Verwerk payment_intent.succeeded ──────────────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as import("stripe").Stripe.PaymentIntent;
    const meta = intent.metadata ?? {};

    const vakmanAccountId = meta.vakman_account ?? "";
    const vakmanTarief    = parseFloat(meta.vakman_prijs ?? "0");
    const offerte         = meta.offerte ?? "";

    if (vakmanAccountId && vakmanTarief > 0) {
      // Dezelfde berekening als in /api/stripe/intent
      const CLIENT_FEE_PCT = 0.05;
      const VAKMAN_FEE_PCT = 0.08;
      const klantBetaald   = Math.round(vakmanTarief * (1 + CLIENT_FEE_PCT) * 100) / 100;
      const vakmanOntvangt = Math.round(vakmanTarief * (1 - VAKMAN_FEE_PCT) * 100) / 100;

      const notificatie: ServerNotificatie = {
        id: Date.now().toString(36),
        vakmanAccountId,
        vakmanTarief,
        vakmanOntvangt,
        klantBetaald,
        offerte,
        timestamp: new Date().toISOString(),
      };

      addServerNotificatie(notificatie);

      console.log(
        `[webhook] Betaling ontvangen | vakman: ${vakmanAccountId} | ` +
        `klant betaald: €${klantBetaald} | vakman ontvangt: €${vakmanOntvangt} | offerte: ${offerte}`
      );

      // TODO: als Supabase beschikbaar → schrijf naar notificaties tabel
      // const { supabase, supabaseReady } = await import("@/lib/supabase");
      // if (supabaseReady) {
      //   await supabase.from("notificaties").insert({ ... });
      // }
    }
  }

  return NextResponse.json({ ontvangen: true });
}
