// ─── Gedeelde klant↔vakman flow-acties ─────────────────────────
// Eén bron van waarheid voor accepteren/weigeren/annuleren,
// gebruikt door /mijn-opdrachten, /offerte/[id] en /opdracht/[id].

import { supabase, stuurNotificatie, type Offerte, type Opdracht } from "@/lib/supabase";

export type AccepteerResultaat =
  | { ok: true; boekingId: string; gesprekId: string | null }
  | { ok: false; reden: string };

/**
 * Klant accepteert een offerte:
 * 1. status-check (dubbel accepteren onmogelijk)
 * 2. offerte → geaccepteerd, overige offertes → geweigerd (+ notificaties)
 * 3. opdracht → geaccepteerd
 * 4. boeking aangemaakt (morgen 10:00 als startmoment tot planning bestaat)
 * 5. gesprek gevonden of aangemaakt
 * 6. notificatie naar vakman
 */
export async function accepteerOfferte(
  klantId: string,
  offerte: Pick<Offerte, "id" | "vakman_id" | "prijs" | "omschrijving">,
  opdracht: Pick<Opdracht, "id" | "titel" | "adres">,
): Promise<AccepteerResultaat> {
  // 1. Alleen accepteren als hij nog wacht — voorkomt dubbel accepteren (2 tabs)
  const { data: geaccepteerd, error: e1 } = await supabase
    .from("offertes")
    .update({ status: "geaccepteerd" } as never)
    .eq("id", offerte.id)
    .eq("status", "wachtend")
    .select("id");
  if (e1) return { ok: false, reden: e1.message };
  if (!geaccepteerd || geaccepteerd.length === 0)
    return { ok: false, reden: "Deze offerte is niet meer beschikbaar." };

  // 2. Overige offertes op dezelfde opdracht weigeren + vakmensen informeren
  const { data: overige } = await supabase
    .from("offertes")
    .select("id, vakman_id")
    .eq("opdracht_id", opdracht.id)
    .eq("status", "wachtend")
    .neq("id", offerte.id);
  if (overige && overige.length > 0) {
    await supabase
      .from("offertes")
      .update({ status: "geweigerd" } as never)
      .eq("opdracht_id", opdracht.id)
      .eq("status", "wachtend")
      .neq("id", offerte.id);
    for (const o of overige as { id: string; vakman_id: string }[]) {
      stuurNotificatie({
        user_id: o.vakman_id,
        type: "offerte_geweigerd",
        titel: "Opdracht vergeven",
        bericht: `${opdracht.titel} — de klant koos een andere offerte.`,
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
  const { data: boeking, error: e2 } = await supabase
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
  if (e2 || !boeking) return { ok: false, reden: "Boeking aanmaken mislukt: " + (e2?.message ?? "onbekend") };
  const boekingId = (boeking as { id: string }).id;

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
    titel: "Offerte geaccepteerd! 🎉",
    bericht: `${opdracht.titel} — de klant heeft je offerte geaccepteerd. Zodra de betaling binnen is, staat de klus in je agenda.`,
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
    .update({ status: "geweigerd" } as never)
    .eq("id", offerteId)
    .eq("status", "wachtend");
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
  // Betaalde boeking? Dan niet zomaar annuleren.
  const { data: betaaldeBoekingen } = await supabase
    .from("boekingen")
    .select("id")
    .eq("opdracht_id", opdracht.id)
    .eq("betaald", true)
    .limit(1);
  if (betaaldeBoekingen && betaaldeBoekingen.length > 0)
    return "Deze opdracht is al betaald — neem contact op via de chat of vraag een terugbetaling aan.";

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
    .in("status", ["gepland"]);

  // Vakmensen met openstaande offertes informeren
  const { data: open } = await supabase
    .from("offertes")
    .select("id, vakman_id")
    .eq("opdracht_id", opdracht.id)
    .in("status", ["wachtend", "geaccepteerd"]);
  if (open) {
    await supabase
      .from("offertes")
      .update({ status: "geweigerd" } as never)
      .eq("opdracht_id", opdracht.id)
      .in("status", ["wachtend", "geaccepteerd"]);
    for (const o of open as { id: string; vakman_id: string }[]) {
      stuurNotificatie({
        user_id: o.vakman_id,
        type: "opdracht_geannuleerd",
        titel: "Opdracht geannuleerd",
        bericht: `${opdracht.titel} — de klant heeft de opdracht geannuleerd.`,
        link: "/feed",
      });
    }
  }
  return null;
}
