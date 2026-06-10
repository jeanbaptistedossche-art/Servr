import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import OSAccessButton from "@/components/OSAccessButton";
import ThemeProvider from "@/components/ThemeProvider";
import AuthGuard from "@/components/AuthGuard";
import PushSubscriber from "@/components/PushSubscriber";
import LocationTracker from "@/components/LocationTracker";

export const metadata: Metadata = {
  title: "Servr — De app voor lokale dienstverleners",
  description: "Vind direct de beste dienstverlener bij jou in de buurt.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Servr",
  },
  icons: {
    icon: [
      { url: "/api/pwa-icon?size=192", sizes: "192x192", type: "image/png" },
      { url: "/api/pwa-icon?size=512", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/api/pwa-icon?size=180", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F6E56",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:ital,wght@0,400;1,400&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-dvh flex flex-col" style={{ background: "var(--paper)", color: "var(--ink)" }}>
        <ThemeProvider />
        <AuthGuard />
        <PushSubscriber />
        <LocationTracker />
        <main className="flex-1 pb-[var(--bottom-nav-height)]">
          {children}
        </main>
        <BottomNav />
        <OSAccessButton />
      </body>
    </html>
  );
}
