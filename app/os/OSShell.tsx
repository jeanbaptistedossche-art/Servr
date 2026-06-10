"use client";
import OSBackground from "@/components/os/OSBackground";
import OSTicker from "@/components/os/OSTicker";

export default function OSShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#000007",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      color: "#eef0ff",
      overflowY: "auto",
      overflowX: "hidden",
    }}>
      <OSBackground />
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        minHeight: "100%",
        paddingBottom: 30,
      }}>
        {children}
      </div>
      <OSTicker />
    </div>
  );
}
