import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Servr OS",
  manifest: "/os-manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000007",
};

export default function OSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000007", overflow: "hidden", zIndex: 9999 }}>
      {children}
    </div>
  );
}
