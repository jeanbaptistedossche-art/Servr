"use client";

import { useEffect } from "react";
import { useInstellingenStore } from "@/lib/instellingenStore";

export default function ThemeProvider() {
  const { darkMode, taal } = useInstellingenStore();

  // Sync dark mode + language to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", darkMode ? "dark" : "light");
    html.lang = taal;
  }, [darkMode, taal]);

  // On first mount: detect system preference if no stored setting
  useEffect(() => {
    const stored = localStorage.getItem("servr-instellingen-v1");
    if (!stored) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        useInstellingenStore.getState().setDarkMode(true);
      }
    }
  }, []);

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => { /* sw not available in dev */ });
    }
  }, []);

  return null;
}
