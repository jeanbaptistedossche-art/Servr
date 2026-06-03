"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady } from "@/lib/supabase";

/**
 * Haalt automatisch de GPS-locatie op zodra de gebruiker ingelogd is.
 * - Vraagt eenmalig toestemming aan de browser
 * - Slaat lat/lng op in profiles
 * - Geen crash als gebruiker weigert — filter valt gewoon weg
 */
export default function LocationTracker() {
  const { userId } = useUserStore();

  useEffect(() => {
    if (!userId || !supabaseReady) return;
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await (supabase.from("profiles") as any).update({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }).eq("id", userId);
        } catch (e) {
          console.warn("Locatie opslaan mislukt:", e);
        }
      },
      (err) => console.warn("Locatie geweigerd of niet beschikbaar:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3600000 }
    );
  }, [userId]);

  return null;
}
