"use client";

import { supabase, type Profile } from "./supabase";
import { useUserStore } from "./store";

// ─── Helper: rol + view uit user_metadata ─────────────────────
function getRolFromMeta(user: { user_metadata?: Record<string, unknown> }) {
  const rol = (user.user_metadata?.rol as string) ?? "klant";
  return rol as "klant" | "vakman" | "beide";
}

function syncStore(
  store: ReturnType<typeof useUserStore.getState>,
  userId: string,
  rol: "klant" | "vakman" | "beide",
  naam: string,
  address: string,
  activeView?: string,
) {
  store.login({ role: rol, name: naam, address: address || "Amsterdam", isAdmin: false });
  const view: "klant" | "vakman" =
    rol === "beide" ? ((activeView as "klant" | "vakman") ?? "vakman") :
    rol === "vakman" ? "vakman" : "klant";
  store.setActiveView(view);
  store.setUserId(userId);
}

// ─── Registreren ──────────────────────────────────────────────
export async function register({
  email, password, name, rol, specialty, city,
}: {
  email: string; password: string; name: string;
  rol: "klant" | "vakman" | "beide";
  specialty?: string; city?: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, rol, specialty: specialty ?? null, city: city ?? null } },
  });
  if (error) throw error;
  return data;
}

// ─── Inloggen ────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  if (data.user) {
    const { data: profileRaw } = await supabase
      .from("profiles").select("*").eq("id", data.user.id).single();
    const profile = profileRaw as Profile | null;
    const store = useUserStore.getState();

    if (profile) {
      const rol = profile.rol as "klant" | "vakman" | "beide";
      syncStore(store, data.user.id, rol, profile.name, profile.address ?? "", profile.active_view);
      store.setProfile({ email: profile.email ?? "", address: profile.address ?? "" });
    } else {
      // Geen profiel gevonden — lees rol uit user_metadata
      const rol = getRolFromMeta(data.user);
      const naam = data.user.user_metadata?.name as string
        ?? data.user.user_metadata?.full_name as string
        ?? data.user.email?.split("@")[0] ?? "Gebruiker";
      const city = (data.user.user_metadata?.city as string) ?? null;
      const specialty = (data.user.user_metadata?.specialty as string) ?? "Algemeen";

      await (supabase.from("profiles") as any).upsert({
        id: data.user.id, name: naam, email: data.user.email ?? "",
        rol, active_view: rol === "vakman" ? "vakman" : "klant", city,
      });
      if (rol === "vakman" || rol === "beide") {
        await (supabase.from("vakmensen") as any).upsert({
          id: data.user.id, specialty, beschikbaar: true,
        });
      }
      syncStore(store, data.user.id, rol, naam, city ?? "Amsterdam");
    }
  }
  return data;
}

// ─── Uitloggen ───────────────────────────────────────────────
export async function logout() {
  await supabase.auth.signOut();
  useUserStore.getState().logout();
  useUserStore.getState().setUserId(null);
}

// ─── Sessie herstellen bij page load ─────────────────────────
export async function restoreSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { data: profileRaw } = await supabase
    .from("profiles").select("*").eq("id", session.user.id).single();
  const profile = profileRaw as Profile | null;
  const store = useUserStore.getState();

  if (profile) {
    const rol = profile.rol as "klant" | "vakman" | "beide";
    syncStore(store, session.user.id, rol, profile.name, profile.address ?? "", profile.active_view);
    store.setProfile({ email: profile.email ?? "", address: profile.address ?? "" });
    return true;
  }

  // Geen profiel — lees rol uit user_metadata
  const rol = getRolFromMeta(session.user);
  const naam = session.user.user_metadata?.name as string
    ?? session.user.user_metadata?.full_name as string
    ?? session.user.email?.split("@")[0] ?? "Gebruiker";
  const city = (session.user.user_metadata?.city as string) ?? null;
  const specialty = (session.user.user_metadata?.specialty as string) ?? "Algemeen";

  await (supabase.from("profiles") as any).upsert({
    id: session.user.id, name: naam, email: session.user.email ?? "",
    rol, active_view: rol === "vakman" ? "vakman" : "klant", city,
  });
  if (rol === "vakman" || rol === "beide") {
    await (supabase.from("vakmensen") as any).upsert({
      id: session.user.id, specialty, beschikbaar: true,
    });
  }
  syncStore(store, session.user.id, rol, naam, city ?? "Amsterdam");
  return true;
}

// ─── Auth state listener ──────────────────────────────────────
export function onAuthChange(callback: (loggedIn: boolean) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) callback(true);
    else if (event === "SIGNED_OUT") callback(false);
  });
}
