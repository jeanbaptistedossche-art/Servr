"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/lib/store";

/**
 * Redirects to /onboarding when the user is not logged in.
 * Uses a mounted-check so Zustand-persist has time to rehydrate
 * from localStorage before we act on the isLoggedIn value.
 */
export default function AuthGuard() {
  const router   = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const { isLoggedIn } = useUserStore.getState();
    if (!isLoggedIn && !pathname.startsWith("/onboarding")) {
      router.replace("/onboarding");
    }
  }, [mounted, pathname, router]);

  return null;
}
