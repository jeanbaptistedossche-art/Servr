import { NextRequest, NextResponse } from "next/server";

/**
 * Stripe webhook handler
 *
 * Stripe dashboard → Webhooks → endpoint:
 *   https://jouw-app.vercel.app/api/stripe/webhook
 * Events: payment_intent.succeeded, payment_intent.payment_failed
 *
 * Env: STRIPE_WEBHOOK_SECRET = whsec_…  (verplicht in productie)
 */
export const dynamic = "force-dynamic";

async function adminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || !secretKey.startsWith("sk_")) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 503 });
  }

  // Raw body nodig voor signature verificatie
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: import("stripe").Stripe.Event;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else if (process.env.NODE_ENV !== "production") {
      // Alleen dev/test: parse zonder verificatie
      event = JSON.parse(body) as import("stripe").Stripe.Event;
    } else {
      return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET ontbreekt" }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    console.error("[webhook] signature fout:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = await adminClient();
  if (!admin) {
    console.error("[webhook] geen service role — kan database niet bijwerken");
    return NextResponse.json({ ontvangen: true, warning: "service role ontbreekt" });
  }

  // ─── payment_intent.succeeded → boeking betaald + notificaties ───
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as import("stripe").Stripe.PaymentIntent;
    const boekingId = intent.metadata?.boeking_id || null;

    const query = admin
      .from("boekingen")
      .select("id, klant_id, vakman_id, betaald, notities, opdracht_id");
    const { data: boeking } = boekingId
      ? await query.eq("id", boekingId).maybeSingle()
      : await query.eq("stripe_intent", intent.id).maybeSingle();

    if (boeking && !boeking.betaald) {
      await admin.from("boekingen")
        .update({ betaald: true, stripe_intent: intent.id })
        .eq("id", boeking.id);
      if (boeking.opdracht_id) {
        await admin.from("opdrachten").update({ status: "bevestigd" }).eq("id", boeking.opdracht_id);
      }

      const titel = boeking.notities ?? "Je klus";
      await admin.from("notificaties").insert([
        {
          user_id: boeking.vakman_id, type: "betaling_ontvangen",
          titel: "Betaling ontvangen ✅",
          bericht: `${titel} — de klant heeft betaald. Uitbetaling volgt na afronding en bevestiging.`,
          link: "/agenda", gelezen: false,
        },
        {
          user_id: boeking.klant_id, type: "betaling_gelukt",
          titel: "Betaling gelukt ✅",
          bericht: `${titel} — je betaling staat veilig bij Servr tot de klus is afgerond.`,
          link: boeking.opdracht_id ? `/opdracht/${boeking.opdracht_id}` : "/mijn-opdrachten",
          gelezen: false,
        },
      ]);
      console.log(`[webhook] betaling verwerkt voor boeking ${boeking.id}`);
    }
  }

  // ─── payment_intent.payment_failed → klant informeren ───
  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as import("stripe").Stripe.PaymentIntent;
    const boekingId = intent.metadata?.boeking_id || null;
    if (boekingId) {
      const { data: boeking } = await admin
        .from("boekingen")
        .select("id, klant_id, notities")
        .eq("id", boekingId)
        .maybeSingle();
      if (boeking) {
        await admin.from("notificaties").insert({
          user_id: boeking.klant_id, type: "betaling_mislukt",
          titel: "Betaling mislukt ⚠️",
          bericht: `${boeking.notities ?? "Je klus"} — de betaling is niet gelukt. Probeer het opnieuw.`,
          link: `/te-betalen?boeking=${boeking.id}`, gelezen: false,
        });
      }
    }
  }

  return NextResponse.json({ ontvangen: true });
}
