// ═══════════════════════════════════════════════════════════════
// GEDEELDE KLANT↔VAKMAN FLOW-ACTIES
// Eén bron van waarheid voor accepteren / weigeren / annuleren.
// Statussen komen EXCLUSIEF uit lib/status.ts (matcht DB constraints).
//
// Flow:  offerte 'wachtend'
//          → klant accepteert  → offerte 'geaccepteerd'
//                                rest    'geweigerd' (+ notificatie)
//                                opdracht 'geaccepteerd'
//                                boeking  'gepland' aangemaakt
//                                gesprek  gevonden/aangemaakt
//          → klant weigert     → offerte 'geweigerd' (+ notificatie)
//          → vakman trekt in   → offerte 'ingetrokken'
// Dubbel accepteren is onmogelijk: de update eist status='wachtend'
// en bij 0 geraakte rijen lezen we de echte status terug voor een
// eerlijke foutmelding.
// ═══════════════════════════════════════════════════════════════

import { supabase, stuurNotificatie, type Offerte, type Opdracht } from "@/lib/supabase";
import { OFFERTE_LABEL, type OfferteStatus } from "@/lib/status";

export type AccepteerResultaat =
  | { ok: true; boekingId: string; gesprekId: string | null }
  | { ok: false; reden: string };

/** Klant accepteert een offerte. Zie statusmachine bovenaan dit bestand. */
export async function accepteerOfferte(
  klantId: string,
  offerte: Pick<Offerte, "id" | "vakman_id" | "prijs" | "omschrijving">,
  opdracht: Pick<Opdracht, "id" | "titel" | "adres">,
): Promise<AccepteerResultaat> {
  // 1. Alleen accepteren als hij nog wacht — voorkomt dubbel accepteren (2 tabs)
  const { data: geaccepteerd, error: e1 } = await supabase
    .from("offertes")
    .update({ status: "geaccepteerd" satisfies OfferteStatus } as never)
    .eq("id", offerte.id)
    .eq("status", "wachtend" satisfies OfferteStatus)
    .select("id");
  if (e1) return { ok: false, reden: "Accepteren mislukt: " + e1.message };

  if (!geaccepteerd || geaccepteerd.length === 0) {
    // 0 rijen geraakt — lees de echte status terug voor een eerlijke melding
    const { data: huidige } = await supabase
      .from("offertes").select("status").eq("id", offerte.id).maybeSingle();
    const status = (huidige as { status: OfferteStatus } | null)?.status;
    if (!status)
      return { ok: false, reden: "We konden deze offerte niet vinden. Herlaad de pagina en probeer opnieuw." };
    if (status === "geaccepteerd")
      return { ok: false, reden: "Je hebt deze offerte al geaccepteerd." };
    if (status === "wachtend")
      return { ok: false, reden: "Accepteren lukte niet door een rechten-instelling in de database. Draai de migratie 20260611_v3_polish.sql in Supabase." };
    return { ok: false, reden: `Deze offerte is ${OFFERTE_LABEL[status].toLowerCase()}.` };
  }

  // 2. Overige offertes op dezelfde opdracht weigeren + vakmensen informeren
  const { data: overige } = await supabase
    .from("offertes")
    .select("id, vakman_id")
    .eq("opdracht_id", opdracht.id)
    .eq("status", "wachtend" satisfies OfferteStatus)
    .neq("id", offerte.id);
  if (overige && overige.length > 0) {
    await supabase
      .from("offertes")
      .update({ status: "geweigerd" satisfies OfferteStatus } as never)
      .eq("opdracht_id", opdracht.id)
      .eq("status", "wachtend" satisfies OfferteStatus)
      .neq("id", offerte.id);
    for (const o of overige as { id: string; vakman_id: string }[]) {
      stuurNotificatie({
        user_id: o.vakman_id,
        type: "offerte_geweigerd",
        titel: "Klus is vergeven",
        bericht: `${opdracht.titel} — de klant koos een andere offerte. Bedankt voor je aanbod!`,
        link: "/offertes",
      });
    }
  }

  // 3. Opdracht-status bijwerken
  await supabase.from("opdrachten").update({ status: "geaccepteerd" } as never).eq("id", opdracht.id);

  // 4. Boeking aanmaken — start_tijd is morgen 10:00 tot echte planning bestaat
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const { data: boekingRaw, error: e2 } = await supabase
    .from("boekingen")
    .insert({
      klant_id: klantId,
      vakman_id: offerte.vakman_id,
      status: "gepland",
      start_tijd: start.toISOString(),
      bedrag: offerte.prijs,
      notities: opdracht.titel,
      adres: opdracht.adres,
      offerte_id: offerte.id,
      opdracht_id: opdracht.id,
      betaald: false,
    } as never)
    .select("id")
    .single();
  const boeking = boekingRaw as { id: string } | null;
  if (e2 || !boeking) return { ok: false, reden: "We konden de afspraak niet inplannen: " + (e2?.message ?? "onbekende fout") };
  const boekingId = boeking.id;

  // 5. Gesprek vinden of aanmaken
  let gesprekId: string | null = null;
  const { data: bestaandRaw } = await supabase
    .from("gesprekken")
    .select("id")
    .eq("klant_id", klantId)
    .eq("vakman_id", offerte.vakman_id)
    .order("laatste_tijd", { ascending: false })
    .limit(1)
    .maybeSingle();
  const bestaand = bestaandRaw as { id: string } | null;
  if (bestaand?.id) {
    gesprekId = bestaand.id;
    await supabase.from("gesprekken").update({
      laatste_bericht: "Offerte geaccepteerd!",
      laatste_tijd: new Date().toISOString(),
      boeking_id: boekingId,
    } as never).eq("id", gesprekId);
  } else {
    const { data: nieuw } = await supabase
      .from("gesprekken")
      .insert({
        klant_id: klantId,
        vakman_id: offerte.vakman_id,
        context: opdracht.titel,
        laatste_bericht: "Offerte geaccepteerd!",
        ongelezen_klant: 0,
        ongelezen_vakman: 1,
        gearchiveerd: false,
        boeking_id: boekingId,
        spoed_id: null,
      } as never)
      .select("id")
      .single();
    gesprekId = (nieuw as { id: string } | null)?.id ?? null;
  }
  if (gesprekId) {
    await supabase.from("offertes").update({ gesprek_id: gesprekId } as never).eq("id", offerte.id);
  }

  // 6. Vakman informeren
  stuurNotificatie({
    user_id: offerte.vakman_id,
    type: "offerte_geaccepteerd",
    titel: "Je offerte is geaccepteerd! 🎉",
    bericht: `${opdracht.titel} — zodra de klant betaald heeft, staat de klus in je agenda.`,
    link: "/agenda",
  });

  return { ok: true, boekingId, gesprekId };
}

/** Klant weigert een offerte */
export async function weigerOfferte(
  offerteId: string,
  vakmanId: string,
  opdrachtTitel: string,
): Promise<string | null> {
  const { error } = await supabase
    .from("offertes")
    .update({ status: "geweigerd" satisfies OfferteStatus } as never)
    .eq("id", offerteId)
    .eq("status", "wachtend" satisfies OfferteStatus);
  if (error) return error.message;
  stuurNotificatie({
    user_id: vakmanId,
    type: "offerte_geweigerd",
    titel: "Offerte geweigerd",
    bericht: `${opdrachtTitel} — de klant heeft je offerte geweigerd.`,
    link: "/offertes",
  });
  return null;
}

/** Klant annuleert een opdracht (alleen zolang er niet betaald is) */
export async function annuleerOpdracht(
  opdracht: Pick<Opdracht, "id" | "titel">,
): Promise<string | null> {
  // Betaalde boeking? Dan loopt annulatie via /api/stripe/refund.
  const { data: betaaldeBoekingen } = await supabase
    .from("boekingen")
    .select("id")
    .eq("opdracht_id", opdracht.id)
    .eq("betaald", true)
    .limit(1);
  if (betaaldeBoekingen && betaaldeBoekingen.length > 0)
    return "Deze klus is al betaald. Annuleer via de klus-pagina, dan storten we je geld terug.";

  const { error } = await supabase
    .from("opdrachten")
    .update({ status: "geannuleerd" } as never)
    .eq("id", opdracht.id);
  if (error) return error.message;

  // Open boekingen annuleren
  await supabase
    .from("boekingen")
    .update({ status: "geannuleerd" } as never)
    .eq("opdracht_id", opdracht.id)
    .eq("status", "gepland");

  // Vakmensen met openstaande offertes informeren
  const { data: open } = await supabase
    .from("offertes")
    .select("id, vakman_id")
    .eq("opdracht_id", opdracht.id)
    .in("status", ["wachtend", "geaccepteerd"] satisfies OfferteStatus[]);
  if (open) {
    await supabase
      .from("offertes")
      .update({ status: "geweigerd" satisfies OfferteStatus } as never)
      .eq("opdracht_id", opdracht.id)
      .in("status", ["wachtend", "geaccepteerd"] satisfies OfferteStatus[]);
    for (const o of open as { id: string; vakman_id: string }[]) {
      stuurNotificatie({
        user_id: o.vakman_id,
        type: "opdracht_geannuleerd",
        titel: "Klus geannuleerd",
        bericht: `${opdracht.titel} — de klant heeft de klus geannuleerd.`,
        link: "/feed",
      });
    }
  }
  return null;
}

/** Vakman trekt zijn eigen offerte in */
export async function trekOfferteIn(offerteId: string): Promise<string | null> {
  const { error } = await supabase
    .from("offertes")
    .update({ status: "ingetrokken" satisfies OfferteStatus } as never)
    .eq("id", offerteId)
    .eq("status", "wachtend" satisfies OfferteStatus);
  return error?.message ?? null;
}
