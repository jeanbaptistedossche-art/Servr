"use client";
import { useState, useEffect } from "react";

const EVENTS = [
  "💳 Nieuwe betaling €180 — Thomas V. (Loodgieter)",
  "🚀 Deployment geslaagd — v2.4.1 op Vercel",
  "📊 Marketing: 3 nieuwe leads via Google Ads",
  "⚡ Intelligence: Competitor Werkspot verhoogt commissie naar 18%",
  "💰 Revenue today: €247 — ↑32% vs gisteren",
  "🤖 Agent Marketing: TikTok campagne gestart — budget €50",
  "🔒 Trust & Safety: 0 verdachte transacties",
  "📈 Data Agent: conversieratio stijgt naar 3.2%",
  "⚙️ Ops: Server health 99.8% — geen alerts",
  "🎯 Growth: A/B test variant B wint met +18% clicks",
  "📋 Finance: Exacte Online sync — 14 facturen verwerkt",
  "🔔 Klant Ahmed B. heeft offerte geaccepteerd — €340",
  "📡 Scout: nieuw Belgisch startup Fixly haalt €2M funding",
  "💼 Product: Feature 'GPS tracking' — 94% tevredenheid",
  "🎉 Milestone: 500 actieve vakmannen bereikt",
];

export default function OSTicker() {
  const [items, setItems] = useState(EVENTS);

  useEffect(() => {
    const id = setInterval(() => {
      const newEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setItems(prev => [newEvent, ...prev.slice(0, 20)]);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  const text = items.join("   ·   ");

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 30,
      background: "rgba(0,0,7,.85)",
      backdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(255,255,255,.05)",
      display: "flex", alignItems: "center",
      overflow: "hidden",
    }}>
      {/* LIVE badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "0 12px",
        borderRight: "1px solid rgba(255,255,255,.06)",
        flexShrink: 0, height: "100%",
        background: "rgba(0,224,150,.06)",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00e096", animation: "os-breathe 1.8s infinite" }} />
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#00e096", letterSpacing: ".15em" }}>
          LIVE
        </span>
      </div>

      {/* Marquee */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{
          whiteSpace: "nowrap",
          display: "inline-block",
          animation: "os-marquee 50s linear infinite",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: "rgba(238,240,255,.35)",
          paddingLeft: "100%",
        }}>
          {text}
        </div>
      </div>
    </div>
  );
}
