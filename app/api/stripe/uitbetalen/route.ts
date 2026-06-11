import { NextRequest, NextResponse } from "next/server";

/**
 * Escrow-vrijgave: betaalt de vakman uit nadat de klant de afronding
 * heeft bevestigd.
 *
 * - Alleen de klant van de boeking mag dit aanroepen (JWT-check)
 * - Vereist: boeking betaald + status 'bevestigd'
 * - Idempotent: tweede aanroep betaalt niet dubbel uit
 * - Transfer = bedrag × 0.93 (vakman −7%; spoed −6%)
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !secretKey.startsWith("sk_"))
    return NextResponse.json({ error: "Stripe niet geconfigureerd" }, { status: 503 });
  if (!supabaseUrl || !serviceKey)
    return NextResponse.json({ error: "Supabase service role niet geconfigureerd" }, { status: 503 });

  try {
    const { boekingId } = await req.json();
    if (!boekingId) return NextResponse.json({ error: "boekingId ontbreekt" }, { status: 400 });

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(supabaseUrl, serviceKey);

    // Caller verifiëren via Supabase JWT
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Sessie ongeldig" }, { status: 401 });

    const { data: boeking } = await admin
      .from("boekingen")
      .select("id, klant_id, vakman_id, bedrag, betaald, status, stripe_intent, uitbetaald_at, notities, opdracht_id")
      .eq("id", boekingId)
      .maybeSingle();
    if (!boeking) return NextResponse.json({ error: "Boeking niet gevonden" }, { status: 404 });
    if (boeking.klant_id !== user.id)
      return NextResponse.json({ error: "Alleen de klant kan de uitbetaling vrijgeven" }, { status: 403 });

    // Idempotent
    if (boeking.uitbetaald_at || boeking.status === "uitbetaald")
      return NextResponse.json({ status: "uitbetaald" });

    if (!boeking.betaald)
      return NextResponse.json({ error: "Deze boeking is nog niet betaald" }, { status: 400 });
    if (boeking.status !== "bevestigd")
      return NextResponse.json({ error: "Bevestig eerst de afronding van de klus" }, { status: 400 });

    // Vakman Stripe-account
    const { data: vakman } = await admin
      .from("vakmensen")
      .select("stripe_account")
      .eq("id", boeking.vakman_id)
      .maybeSingle();
    const stripeAccount = vakman?.stripe_account as string | null;
    if (!stripeAccount)
      return NextResponse.json({ error: "Vakman heeft geen Stripe-account gekoppeld" }, { status: 400 });

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });

    // Fee-percentage uit de oorspronkelijke intent (spoed −6% / normaal −7%)
    let vakmanFeePct = 0.07;
    let sourceCharge: string | undefined;
    if (boeking.stripe_intent) {
      const intent = await stripe.paymentIntents.retrieve(boeking.stripe_intent);
      const metaPct = parseFloat(intent.metadata?.vakman_fee_pct ?? "");
      if (!isNaN(metaPct) && metaPct > 0 && metaPct < 0.2) vakmanFeePct = metaPct;
      sourceCharge = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;
    }

    const bedrag = Number(boeking.bedrag ?? 0);
    const uitbetaling = Math.round(bedrag * (1 - vakmanFeePct) * 100); // centen

    const transfer = await stripe.transfers.create({
      amount: uitbetaling,
      currency: "eur",
      destination: stripeAccount,
      ...(sourceCharge ? { source_transaction: sourceCharge } : {}),
      metadata: { boeking_id: boeking.id, vakman_fee_pct: String(vakmanFeePct) },
      description: `Servr uitbetaling — ${boeking.notities ?? boeking.id}`,
    });

    const nu = new Date().toISOString();
    await admin.from("boekingen")
      .update({ status: "uitbetaald", uitbetaald_at: nu, transfer_id: transfer.id })
      .eq("id", boekingId);
    if (boeking.opdracht_id) {
      await admin.from("opdrachten").update({ status: "afgerond" }).eq("id", boeking.opdracht_id);
    }

    await admin.from("notificaties").insert({
      user_id: boeking.vakman_id,
      type: "uitbetaald",
      titel: "Uitbetaling onderweg 💸",
      bericht: `${boeking.notities ?? "Je klus"} — €${(uitbetaling / 100).toFixed(2)} wordt overgemaakt naar je rekening (klusbedrag −${Math.round(vakmanFeePct * 100)}% Servr fee).`,
      link: "/verdiensten",
      gelezen: false,
    });

    return NextResponse.json({ status: "uitbetaald", bedrag: uitbetaling / 100, transferId: transfer.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
