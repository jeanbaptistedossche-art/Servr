import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True als de Supabase-credentials ingevuld zijn */
export const supabaseReady = Boolean(
  url && url !== "your_supabase_url" &&
  url.startsWith("http") &&
  key && key !== "your_supabase_anon_key"
);

// Maak client alleen aan als de URL geldig is — anders crasht createClient
export const supabase: SupabaseClient = supabaseReady
  ? createClient(url, key)
  : createClient("https://placeholder.supabase.co", "placeholder-key");

// ─── types ────────────────────────────────────────────────────────────────────

export type DbProfile = {
  id: string;
  role: "klant" | "vakman";
  name: string;
  address: string;
  lat: number;
  lng: number;
  avatar_url?: string;
  created_at?: string;
};

export type DbVakman = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  avatar_url?: string;
  categorie: string;
  servr_score: number;
  rating: number;
  review_count: number;
  radius_km: number;
  is_online: boolean;
};
