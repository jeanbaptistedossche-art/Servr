/**
 * Database-laag — werkt met Supabase als de keys ingevuld zijn,
 * anders valt het terug op mock-data.
 */
import { supabase, supabaseReady, type DbProfile, type DbVakman } from "./supabase";

// ─── profiel opslaan ──────────────────────────────────────────────────────────

export async function upsertProfile(profile: Omit<DbProfile, "created_at">): Promise<void> {
  if (!supabaseReady) return;
  await supabase.from("profiles").upsert(profile, { onConflict: "id" });
}

// ─── anonieme vakman-ID genereren (zonder auth) ───────────────────────────────

export function genId(): string {
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── vakmensen ophalen ────────────────────────────────────────────────────────

export async function getVakmensen(): Promise<DbVakman[]> {
  if (!supabaseReady) return [];

  const { data, error } = await supabase
    .from("vakmensen_view")   // view die profiles + vakmensen joinen
    .select("*")
    .order("servr_score", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as DbVakman[];
}

// ─── vakman registreren ───────────────────────────────────────────────────────

export async function registerVakman(opts: {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  categorie: string;
}): Promise<void> {
  if (!supabaseReady) return;

  // Sla profiel op
  await supabase.from("profiles").upsert({
    id: opts.id,
    role: "vakman",
    name: opts.name,
    address: opts.address,
    lat: opts.lat,
    lng: opts.lng,
  }, { onConflict: "id" });

  // Sla vakman-data op
  await supabase.from("vakmensen").upsert({
    id: opts.id,
    categorie: opts.categorie,
    servr_score: 80,
    rating: 0,
    review_count: 0,
    radius_km: 10,
    is_online: true,
  }, { onConflict: "id" });
}
