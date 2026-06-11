import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseReady = Boolean(
  url && url !== "your_supabase_url" && url.startsWith("http") &&
  key && key !== "your_supabase_anon_key"
);

export const supabase: SupabaseClient<Database> = supabaseReady
  ? createClient<Database>(url, key)
  : createClient<Database>("https://placeholder.supabase.co", "placeholder");

// ─── Database types ───────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles:       { Row: Profile;       Insert: ProfileInsert;       Update: Partial<ProfileInsert> };
      vakmensen:      { Row: Vakman;         Insert: VakmanInsert;         Update: Partial<VakmanInsert> };
      diensten:       { Row: Dienst;         Insert: DienstInsert;         Update: Partial<DienstInsert> };
      boekingen:      { Row: Boeking;        Insert: BoekingInsert;        Update: Partial<BoekingInsert> };
      spoed_oproepen: { Row: SpoedOproep;    Insert: SpoedOproepInsert;    Update: Partial<SpoedOproepInsert> };
      gesprekken:     { Row: Gesprek;        Insert: GesprekInsert;        Update: Partial<GesprekInsert> };
      berichten:      { Row: Bericht;        Insert: BerichtInsert;        Update: Partial<BerichtInsert> };
      reviews:        { Row: Review;         Insert: ReviewInsert;         Update: Partial<ReviewInsert> };
      opdrachten:     { Row: Opdracht;       Insert: OpdrachtInsert;       Update: Partial<OpdrachtInsert> };
      offertes:       { Row: Offerte;        Insert: OfferteInsert;        Update: Partial<OfferteInsert> };
      notificaties:   { Row: Notificatie;    Insert: NotificatieInsert;    Update: Partial<NotificatieInsert> };
    };
  };
};

// ─── Status machines (één bron van waarheid) ─────────────────
export const OPDRACHT_STATUS = ["open", "offerte_ontvangen", "geaccepteerd", "bevestigd", "afgerond", "geannuleerd"] as const;
export type OpdrachtStatus = (typeof OPDRACHT_STATUS)[number];

export const BOEKING_STATUS = ["gepland", "bezig", "ingecheckt", "afgerond", "bevestigd", "uitbetaald", "geannuleerd", "geschil"] as const;
export type BoekingStatus = (typeof BOEKING_STATUS)[number];

export const OFFERTE_STATUS = ["wachtend", "geaccepteerd", "geweigerd", "ingetrokken"] as const;
export type OfferteStatus = (typeof OFFERTE_STATUS)[number];

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  country: string;
  avatar_url: string | null;
  rol: "klant" | "vakman" | "beide";
  active_view: "klant" | "vakman";
  created_at: string;
  updated_at: string;
};
export type ProfileInsert = Omit<Profile, "created_at" | "updated_at">;

export type Vakman = {
  id: string;
  specialty: string | null;
  bio: string | null;
  kvk: string | null;
  btw_nummer: string | null;
  iban: string | null;
  stripe_account: string | null;
  radius_km: number;
  beschikbaar: boolean;
  rating: number;
  review_count: number;
  klus_count: number;
  omzet_maand: number;
  created_at: string;
};
export type VakmanInsert = Omit<Vakman, "created_at" | "rating" | "review_count" | "klus_count" | "omzet_maand">;

export type Dienst = {
  id: string;
  vakman_id: string;
  naam: string;
  beschrijving: string | null;
  prijs: number;        // centen
  eenheid: "per uur" | "per dag" | "vast bedrag" | "per m²" | "per stuk";
  duur_minuten: number;
  buffer_minuten: number;
  categorie: string | null;
  btw: boolean;
  btw_percentage: number;
  actief: boolean;
  created_at: string;
};
export type DienstInsert = Omit<Dienst, "id" | "created_at">;

export type Boeking = {
  id: string;
  klant_id: string;
  vakman_id: string;
  dienst_id: string | null;
  status: BoekingStatus;
  start_tijd: string;
  eind_tijd: string | null;
  adres: string | null;
  notities: string | null;
  bedrag: number | null;          // in euro's
  stripe_intent: string | null;
  betaald: boolean;
  opdracht_id: string | null;
  offerte_id: string | null;
  ingecheckt_at: string | null;
  afgerond_at: string | null;
  bevestigd_at: string | null;
  uitbetaald_at: string | null;
  transfer_id: string | null;
  created_at: string;
};
export type BoekingInsert = Partial<Omit<Boeking, "id" | "created_at">> &
  Pick<Boeking, "klant_id" | "vakman_id" | "start_tijd">;

export type SpoedOproep = {
  id: string;
  klant_id: string;
  categorie: string;
  titel: string | null;
  omschrijving: string | null;
  adres: string | null;
  foto_urls: string[];
  status: "open" | "aangenomen" | "verlopen" | "geannuleerd";
  aangenomen_door: string | null;
  boeking_id: string | null;
  prijs_min: number | null;
  prijs_max: number | null;
  created_at: string;
  expires_at: string;
};
export type SpoedOproepInsert = Omit<SpoedOproep, "id" | "created_at" | "expires_at" | "status" | "aangenomen_door" | "boeking_id">;

export type Gesprek = {
  id: string;
  klant_id: string;
  vakman_id: string;
  boeking_id: string | null;
  spoed_id: string | null;
  context: string | null;
  laatste_bericht: string | null;
  laatste_tijd: string;
  ongelezen_klant: number;
  ongelezen_vakman: number;
  gearchiveerd: boolean;
  created_at: string;
};
export type GesprekInsert = Omit<Gesprek, "id" | "created_at" | "laatste_tijd">;

export type Bericht = {
  id: string;
  gesprek_id: string;
  afzender_id: string;
  tekst: string | null;
  bijlage_url: string | null;
  bijlage_type: string | null;
  gelezen: boolean;
  created_at: string;
};
export type BerichtInsert = Omit<Bericht, "id" | "created_at" | "gelezen">;

export type Review = {
  id: string;
  boeking_id: string;
  klant_id: string;
  vakman_id: string;
  score: number;
  tekst: string | null;
  reviewer_rol: "klant" | "vakman";
  created_at: string;
};
export type ReviewInsert = Omit<Review, "id" | "created_at">;

export type Opdracht = {
  id: string;
  klant_id: string;
  titel: string;
  beschrijving: string | null;
  categorie: string | null;
  adres: string | null;
  urgentie: "laag" | "middel" | "hoog";
  budget: string | null;
  status: OpdrachtStatus;
  lat: number | null;
  lng: number | null;
  foto_url: string | null;
  created_at: string;
};
export type OpdrachtInsert = Partial<Omit<Opdracht, "id" | "created_at">> &
  Pick<Opdracht, "klant_id" | "titel">;

export type Offerte = {
  id: string;
  opdracht_id: string | null;
  vakman_id: string;
  prijs: number;                  // in euro's
  omschrijving: string | null;
  eta: string | null;
  status: OfferteStatus;
  gesprek_id: string | null;
  created_at: string;
};
export type OfferteInsert = Partial<Omit<Offerte, "id" | "created_at">> &
  Pick<Offerte, "vakman_id" | "prijs">;

export type Notificatie = {
  id: string;
  user_id: string;
  type: string;
  titel: string;
  bericht: string | null;
  link: string | null;
  gelezen: boolean;
  created_at: string;
};
export type NotificatieInsert = Partial<Omit<Notificatie, "id" | "created_at">> &
  Pick<Notificatie, "user_id" | "type" | "titel">;

// ─── Helpers ──────────────────────────────────────────────────

/** Haal het profiel van de ingelogde gebruiker op */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

/** Haal vakman-data op (inclusief profiel via join) */
export async function getVakman(id: string) {
  const { data } = await supabase
    .from("vakmensen")
    .select(`*, profiles(name, email, phone, address, avatar_url)`)
    .eq("id", id)
    .single();
  return data;
}

/** Diensten van een vakman */
export async function getDiensten(vakmanId: string) {
  const { data } = await supabase
    .from("diensten")
    .select("*")
    .eq("vakman_id", vakmanId)
    .order("actief", { ascending: false });
  return data ?? [];
}

/** Gesprekken voor de ingelogde gebruiker */
export async function getGesprekken(userId: string, rol: "klant" | "vakman") {
  const field = rol === "klant" ? "klant_id" : "vakman_id";
  const { data } = await supabase
    .from("gesprekken")
    .select(`*, profiles!gesprekken_klant_id_fkey(name, avatar_url), vakmensen!gesprekken_vakman_id_fkey(specialty, profiles(name, avatar_url))`)
    .eq(field, userId)
    .order("laatste_tijd", { ascending: false });
  return data ?? [];
}

/** Berichten van een gesprek (realtime-klaar) */
export async function getBerichten(gesprekId: string) {
  const { data } = await supabase
    .from("berichten")
    .select("*")
    .eq("gesprek_id", gesprekId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Boekingen van vandaag (vakman) */
export async function getVandaagBoekingen(vakmanId: string) {
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  const morgen = new Date(vandaag);
  morgen.setDate(morgen.getDate() + 1);

  const { data } = await supabase
    .from("boekingen")
    .select(`*, profiles!boekingen_klant_id_fkey(name, phone, address), diensten(naam)`)
    .eq("vakman_id", vakmanId)
    .gte("start_tijd", vandaag.toISOString())
    .lt("start_tijd", morgen.toISOString())
    .in("status", ["gepland", "bezig"])
    .order("start_tijd");
  return data ?? [];
}

/** Open spoed-oproepen (voor vakman-inbox) */
export async function getSpoedOproepen() {
  const { data } = await supabase
    .from("spoed_oproepen")
    .select(`*, profiles!spoed_oproepen_klant_id_fkey(name, address)`)
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Prijsformat: centen → "€85" (alleen voor diensten — die staan in centen) */
export function formatPrijs(centen: number): string {
  return `€${Math.round(centen / 100)}`;
}

/** Euro-format voor opdrachten/offertes/boekingen (staan in euro's): 85 → "€ 85" · 85.5 → "€ 85,50" */
export function formatEuro(euros: number | null | undefined): string {
  if (euros == null || isNaN(euros)) return "€ 0";
  const isRound = Math.abs(euros % 1) < 0.005;
  return isRound
    ? `€ ${Math.round(euros).toLocaleString("nl-BE")}`
    : `€ ${euros.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Waze deeplink (enige navigatie-app — geen Google Maps key) */
export function wazeUrl(lat: number | null | undefined, lng: number | null | undefined, adres?: string | null): string | null {
  if (lat != null && lng != null) return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  if (adres) return `https://waze.com/ul?q=${encodeURIComponent(adres)}&navigate=yes`;
  return null;
}

/** Haversine afstand in km tussen twee coördinaten */
export function afstandKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** In-app notificatie aanmaken (push kan falen, in-app niet) */
export async function stuurNotificatie(n: NotificatieInsert) {
  try { await supabase.from("notificaties").insert(n as never); } catch { /* stil falen */ }
}
