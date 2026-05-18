import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(url, key);

/** True als de Supabase-credentials ingevuld zijn */
export const supabaseReady = Boolean(
  url && url !== "your_supabase_url" &&
  key && key !== "your_supabase_anon_key"
);

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
