"use client";
import OSBackground from "@/components/os/OSBackground";
import OSTicker from "@/components/os/OSTicker";

export default function OSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#000007",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      color: "#eef0ff",
      overflowY: "auto",
      overflowX: "hidden",
    }}>
      {/* Layer 1: animated canvas background */}
      <OSBackground />

      {/* Layer 2+3: content */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        minHeight: "100%",
        paddingBottom: 30, /* ticker height */
      }}>
        {children}
      </div>

      {/* Fixed bottom ticker */}
      <OSTicker />
    </div>
  );
}
