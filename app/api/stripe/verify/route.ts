import { NextRequest, NextResponse } from "next/server";

/**
 * Verifieert een Stripe-betaling server-side na de redirect.
 * Klant komt terug op /te-betalen?betaald=1&boeking={id}&payment_intent=pi_…
 * → wij checken bij Stripe of de intent echt geslaagd is en markeren de
 * boeking als betaald (service role — idempotent).
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !secretKey.startsWith("sk_")) {
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 503 });
  }
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase service role niet geconfigureerd" }, { status: 503 });
  }

  try {
    const { boekingId, paymentIntentId } = await req.json();
    if (!boekingId) return NextResponse.json({ error: "boekingId ontbreekt" }, { status: 400 });

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: boeking } = await admin
      .from("boekingen")
      .select("id, klant_id, vakman_id, bedrag, betaald, stripe_intent, notities, opdracht_id")
      .eq("id", boekingId)
      .maybeSingle();
    if (!boeking) return NextResponse.json({ error: "Boeking niet gevonden" }, { status: 404 });

    // Al verwerkt (bv. door de webhook) → klaar
    if (boeking.betaald) return NextResponse.json({ status: "betaald" });

    const intentId: string | null = paymentIntentId ?? boeking.stripe_intent;
    if (!intentId) return NextResponse.json({ error: "Geen betaling gevonden voor deze boeking" }, { status: 400 });

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
    const intent = await stripe.paymentIntents.retrieve(intentId);

    // Veiligheidscheck: intent moet bij deze boeking horen
    if (intent.metadata?.boeking_id && intent.metadata.boeking_id !== boekingId) {
      return NextResponse.json({ error: "Betaling hoort niet bij deze boeking" }, { status: 400 });
    }

    if (intent.status !== "succeeded") {
      return NextResponse.json({ status: intent.status });
    }

    // Markeer betaald + informeer beide partijen
    await admin.from("boekingen")
      .update({ betaald: true, stripe_intent: intent.id })
      .eq("id", boekingId);
    if (boeking.opdracht_id) {
      await admin.from("opdrachten").update({ status: "bevestigd" }).eq("id", boeking.opdracht_id);
    }

    const titel = boeking.notities ?? "Je klus";
    await admin.from("notificaties").insert([
      {
        user_id: boeking.vakman_id,
        type: "betaling_ontvangen",
        titel: "Betaling ontvangen ✅",
        bericht: `${titel} — de klant heeft betaald. De klus staat in je agenda; uitbetaling volgt na afronding en bevestiging.`,
        link: "/agenda",
        gelezen: false,
      },
      {
        user_id: boeking.klant_id,
        type: "betaling_gelukt",
        titel: "Betaling gelukt ✅",
        bericht: `${titel} — je betaling staat veilig bij Servr tot de klus is afgerond.`,
        link: boeking.opdracht_id ? `/opdracht/${boeking.opdracht_id}` : "/mijn-opdrachten",
        gelezen: false,
      },
    ]);

    return NextResponse.json({ status: "betaald" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
