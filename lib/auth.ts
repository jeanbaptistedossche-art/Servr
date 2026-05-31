"use client";

import { supabase, type Profile } from "./supabase";
import { useUserStore } from "./store";

// ─── Registreren ──────────────────────────────────────────────
export async function register({
  email,
  password,
  name,
  rol,
  specialty,
}: {
  email: string;
  password: string;
  name: string;
  rol: "klant" | "vakman" | "beide";
  specialty?: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, rol, specialty: specialty ?? null },
    },
  });
  if (error) throw error;
  return data;
}

// ─── Inloggen ────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // Laad profiel en sync naar Zustand store
  if (data.user) {
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    const profile = profileRaw as Profile | null;

    if (profile) {
      const store = useUserStore.getState();
      // login() sets: isLoggedIn, role, activeView, name, address
      store.login({
        role: profile.rol as "klant" | "vakman" | "beide",
        name: profile.name,
        address: profile.address ?? "Amsterdam",
        isAdmin: false,
      });
      // Override activeView met de opgeslagen waarde
      store.setActiveView(profile.active_view as "klant" | "vakman");
      // Extra profielvelden
      store.setProfile({
        email: profile.email ?? "",
        address: profile.address ?? "",
      });
      store.setUserId(data.user.id);
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
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  const profile = profileRaw as Profile | null;

  if (profile) {
    const store = useUserStore.getState();
    store.login({
      role: profile.rol as "klant" | "vakman" | "beide",
      name: profile.name,
      address: profile.address ?? "Amsterdam",
      isAdmin: false,
    });
    store.setActiveView(profile.active_view as "klant" | "vakman");
    store.setProfile({
      email: profile.email ?? "",
      address: profile.address ?? "",
    });
    store.setUserId(session.user.id);
    return true;
  }
  return false;
}

// ─── Auth state listener (gebruik in layout) ─────────────────
export function onAuthChange(callback: (loggedIn: boolean) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      callback(true);
    } else if (event === "SIGNED_OUT") {
      callback(false);
    }
  });
}
