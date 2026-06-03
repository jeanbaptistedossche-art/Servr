"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSubscriber() {
  const { userId, activeView, specialty } = useUserStore();

  useEffect(() => {
    if (!userId || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          // Al geabonneerd — update categorie
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: existing.toJSON(), userId, categorie: specialty || null }),
          });
          return;
        }

        // Vraag toestemming
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });

        // Haal locatie op voor push filtering
        let lat: number | null = null;
        let lng: number | null = null;
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch { /* locatie niet beschikbaar */ }

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subscription.toJSON(), userId, categorie: specialty || null, lat, lng }),
        });
      } catch (e) {
        console.warn("Push subscription mislukt:", e);
      }
    }

    subscribe();
  }, [userId, specialty]);

  return null;
}
