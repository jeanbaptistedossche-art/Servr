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
    };
  };
};

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
  status: "gepland" | "bezig" | "afgerond" | "geannuleerd";
  start_tijd: string;
  eind_tijd: string | null;
  adres: string | null;
  notities: string | null;
  bedrag: number | null;
  stripe_intent: string | null;
  betaald: boolean;
  created_at: string;
};
export type BoekingInsert = Omit<Boeking, "id" | "created_at">;

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
  created_at: string;
};
export type ReviewInsert = Omit<Review, "id" | "created_at">;

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

/** Prijsformat: centen → "€85" */
export function formatPrijs(centen: number): string {
  return `€${Math.round(centen / 100)}`;
}
