"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { supabaseReady } from "@/lib/supabase";

/**
 * 1. Probeert de Supabase-sessie te herstellen — EENMALIG bij de eerste load
 * 2. Bij elke navigatie: controleert alleen of de gebruiker ingelogd is
 * 3. Stuurt naar /onboarding als er geen sessie is
 */
export default function AuthGuard() {
  const router   = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const hasRestored = useRef(false); // sessie maar 1x herstellen

  useEffect(() => {
    async function check() {
      // Publieke routes — nooit redirecten
      if (pathname.startsWith("/onboarding") || pathname.startsWith("/vakman-setup")) {
        setChecked(true);
        return;
      }

      // Eerste load: haal sessie op uit Supabase en sync naar store
      if (!hasRestored.current && supabaseReady) {
        hasRestored.current = true;
        try {
          const { restoreSession } = await import("@/lib/auth");
          const restored = await restoreSession();
          if (restored) { setChecked(true); return; }
        } catch {
          // Supabase fout → fallback naar localStorage
        }
      }

      // Daarna: vertrouw op de Zustand store (persist in localStorage)
      const { isLoggedIn } = useUserStore.getState();
      if (!isLoggedIn) {
        router.replace("/onboarding");
      }
      setChecked(true);
    }

    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
