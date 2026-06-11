// ═══════════════════════════════════════════════════════════════
// STATUSMACHINE — ÉÉN BRON VAN WAARHEID
//
// Deze unions matchen EXACT de check constraints in de database
// (supabase/migrations/20260611_v3_polish.sql zet de constraints
// op precies deze waarden). Nooit een losse status-string in een
// component — altijd via dit bestand.
//
// OPDRACHT:  open ──► offerte_ontvangen ──► geaccepteerd ──► bevestigd ──► afgerond
//            (elke stap kan ──► geannuleerd)
//
// OFFERTE:   wachtend ──► geaccepteerd
//                     └─► geweigerd
//                     └─► ingetrokken (door vakman zelf)
//
// BOEKING:   gepland ──► ingecheckt ──► afgerond ──► bevestigd ──► uitbetaald
//            gepland ──► geannuleerd (refund)
//            ingecheckt/afgerond ──► geschil (admin)
//            ("bezig" = legacy alias voor ingecheckt, blijft geldig voor oude rijen)
// ═══════════════════════════════════════════════════════════════

export const OPDRACHT_STATUSSEN = ["open", "offerte_ontvangen", "geaccepteerd", "bevestigd", "afgerond", "geannuleerd"] as const;
export type OpdrachtStatus = (typeof OPDRACHT_STATUSSEN)[number];

export const OFFERTE_STATUSSEN = ["wachtend", "geaccepteerd", "geweigerd", "ingetrokken"] as const;
export type OfferteStatus = (typeof OFFERTE_STATUSSEN)[number];

export const BOEKING_STATUSSEN = ["gepland", "bezig", "ingecheckt", "afgerond", "bevestigd", "uitbetaald", "geannuleerd", "geschil"] as const;
export type BoekingStatus = (typeof BOEKING_STATUSSEN)[number];

// ─── Labels in mensentaal (B1-niveau) ──────────────────────────

export const OPDRACHT_LABEL: Record<OpdrachtStatus, string> = {
  open: "Wacht op offertes",
  offerte_ontvangen: "Je hebt offertes",
  geaccepteerd: "Offerte gekozen",
  bevestigd: "Ingepland",
  afgerond: "Klaar",
  geannuleerd: "Geannuleerd",
};

export const OFFERTE_LABEL: Record<OfferteStatus, string> = {
  wachtend: "Wacht op antwoord",
  geaccepteerd: "Geaccepteerd",
  geweigerd: "Geweigerd",
  ingetrokken: "Ingetrokken",
};

export const BOEKING_LABEL_KLANT: Record<BoekingStatus, string> = {
  gepland: "Vakman komt langs",
  bezig: "Vakman is bezig",
  ingecheckt: "Vakman is bezig",
  afgerond: "Klus is klaar — bevestig",
  bevestigd: "Bevestigd",
  uitbetaald: "Helemaal klaar ✓",
  geannuleerd: "Geannuleerd",
  geschil: "In behandeling",
};

export const BOEKING_LABEL_VAKMAN: Record<BoekingStatus, string> = {
  gepland: "Gepland",
  bezig: "Bezig",
  ingecheckt: "Bezig",
  afgerond: "Wacht op de klant",
  bevestigd: "Bevestigd — uitbetaling volgt",
  uitbetaald: "Uitbetaald ✓",
  geannuleerd: "Geannuleerd",
  geschil: "In behandeling",
};

// "Wie is aan zet" — voor de stap-indicator in de flow
export function wieAanZet(boekingStatus: BoekingStatus, betaald: boolean, ikBenKlant: boolean): string {
  if (boekingStatus === "gepland" && !betaald) return ikBenKlant ? "Jij bent aan zet: betaal de klus" : "De klant moet nog betalen";
  if (boekingStatus === "gepland") return ikBenKlant ? "De vakman komt langs op de afgesproken dag" : "Jij bent aan zet: ga langs en check in";
  if (boekingStatus === "ingecheckt" || boekingStatus === "bezig") return ikBenKlant ? "De vakman is aan het werk" : "Jij bent aan zet: rond de klus af als je klaar bent";
  if (boekingStatus === "afgerond") return ikBenKlant ? "Jij bent aan zet: bevestig en beoordeel" : "De klant moet de klus nog bevestigen";
  if (boekingStatus === "bevestigd") return "De uitbetaling wordt verwerkt";
  if (boekingStatus === "uitbetaald") return "Alles is afgerond";
  return "";
}

// Status-kleuren (design tokens)
export function statusKleur(status: BoekingStatus | OpdrachtStatus | OfferteStatus): { color: string; bg: string } {
  switch (status) {
    case "afgerond": case "bevestigd": case "uitbetaald": case "geaccepteerd":
      return { color: "var(--forest)", bg: "var(--success-bg)" };
    case "geannuleerd": case "geweigerd": case "geschil":
      return { color: "var(--danger)", bg: "var(--danger-bg)" };
    case "ingecheckt": case "bezig": case "offerte_ontvangen":
      return { color: "var(--copper)", bg: "var(--warning-bg)" };
    default:
      return { color: "var(--ink-fade)", bg: "var(--accent-bg)" };
  }
}
