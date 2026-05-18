import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import AuthGuard from "@/components/AuthGuard";

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
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
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
      <body className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider />
        <AuthGuard />
        <main className="flex-1 pb-[var(--bottom-nav-height)]">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
