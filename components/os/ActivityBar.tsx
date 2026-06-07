"use client";

import { useActivityFeed } from "@/hooks/useActivityFeed";

export default function ActivityBar() {
  const { activities, time } = useActivityFeed();

  const items = [...activities, ...activities]; // duplicate for seamless loop

  return (
    <div style={{
      height: 40, background: "#050505",
      borderTop: "1px solid #1a1a1a",
      display: "flex", alignItems: "center",
      overflow: "hidden", flexShrink: 0,
    }}>
      {/* Scrolling marquee */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{
          display: "flex", gap: 0, whiteSpace: "nowrap",
          animation: activities.length > 0 ? "os-marquee 30s linear infinite" : "none",
          width: "max-content",
        }}>
          {items.map((a, i) => (
            <span key={i} style={{ fontSize: 11, color: "#4b5563", paddingRight: 32 }}>
              {a.emoji} {a.text} ·
            </span>
          ))}
        </div>
      </div>

      {/* Right: clock + live */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0 16px", flexShrink: 0,
        borderLeft: "1px solid #1a1a1a",
      }}>
        <span style={{ fontSize: 11, color: "#4b5563", fontFamily: "monospace" }}>{time}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 4px #10b981",
            animation: "os-pulse 2s infinite",
          }} />
          <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>LIVE</span>
        </div>
      </div>
    </div>
  );
}
