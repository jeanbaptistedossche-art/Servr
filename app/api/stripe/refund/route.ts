import { NextRequest, NextResponse } from "next/server";

/**
 * Annulatie & terugbetaling.
 *
 * - Vóór incheck (status 'gepland'): volledige refund + boeking geannuleerd
 * - Ná incheck: geen automatische refund — boeking → 'geschil'
 *   (admin beslist handmatig via het Stripe dashboard)
 * - Alleen de klant van de boeking mag dit aanroepen
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

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Sessie ongeldig" }, { status: 401 });

    const { data: boeking } = await admin
      .from("boekingen")
      .select("id, klant_id, vakman_id, betaald, status, stripe_intent, notities, opdracht_id")
      .eq("id", boekingId)
      .maybeSingle();
    if (!boeking) return NextResponse.json({ error: "Boeking niet gevonden" }, { status: 404 });
    if (boeking.klant_id !== user.id)
      return NextResponse.json({ error: "Alleen de klant kan annuleren" }, { status: 403 });

    if (boeking.status === "geannuleerd") return NextResponse.json({ status: "geannuleerd" });
    if (boeking.status === "uitbetaald")
      return NextResponse.json({ error: "Deze klus is al uitbetaald — refund niet meer mogelijk" }, { status: 400 });

    const titel = boeking.notities ?? "Je klus";

    // Ná incheck → geschil (admin handmatig)
    if (boeking.status !== "gepland") {
      await admin.from("boekingen").update({ status: "geschil" }).eq("id", boekingId);
      await admin.from("notificaties").insert([
        {
          user_id: boeking.vakman_id, type: "geschil",
          titel: "Geschil geopend ⚠️",
          bericht: `${titel} — de klant heeft een geschil geopend. Servr neemt contact op.`,
          link: "/agenda", gelezen: false,
        },
        {
          user_id: boeking.klant_id, type: "geschil",
          titel: "Geschil geopend",
          bericht: `${titel} — we bekijken je melding en nemen binnen 1 werkdag contact op.`,
          link: "/mijn-opdrachten", gelezen: false,
        },
      ]);
      return NextResponse.json({ status: "geschil" });
    }

    // Vóór incheck → volledige refund (als er betaald is)
    if (boeking.betaald && boeking.stripe_intent) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
      await stripe.refunds.create({ payment_intent: boeking.stripe_intent });
    }

    await admin.from("boekingen").update({ status: "geannuleerd" }).eq("id", boekingId);
    if (boeking.opdracht_id) {
      await admin.from("opdrachten").update({ status: "geannuleerd" }).eq("id", boeking.opdracht_id);
    }

    await admin.from("notificaties").insert([
      {
        user_id: boeking.vakman_id, type: "geannuleerd",
        titel: "Klus geannuleerd",
        bericht: `${titel} — de klant heeft geannuleerd vóór de start. De klus is uit je agenda gehaald.`,
        link: "/agenda", gelezen: false,
      },
      {
        user_id: boeking.klant_id, type: "geannuleerd",
        titel: boeking.betaald ? "Geannuleerd — geld onderweg" : "Geannuleerd",
        bericht: boeking.betaald
          ? `${titel} — je volledige betaling wordt teruggestort (3-5 werkdagen).`
          : `${titel} is geannuleerd.`,
        link: "/mijn-opdrachten", gelezen: false,
      },
    ]);

    return NextResponse.json({ status: "geannuleerd", refunded: Boolean(boeking.betaald) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
