"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, Settings, Search, ChevronRight,
  LayoutDashboard, Calendar, Clock, QrCode,
} from "lucide-react";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

// ── Vandaag tools (expanded group) ────────────────────────────
const VANDAAG_TOOLS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    sub: "Overzicht en omzet",
  },
  {
    href: "/agenda",
    icon: Calendar,
    label: "Agenda",
    sub: "3 boekingen vandaag",
    badge: "€290",
  },
  {
    href: "/urenregistratie",
    icon: Clock,
    label: "Urenregistratie",
    sub: "Timer per klus",
  },
  {
    href: "/inchecken",
    icon: QrCode,
    label: "QR Check-in",
    sub: "Aanwezigheid",
  },
];

// ── Collapsed groups ──────────────────────────────────────────
const GROEPEN = [
  {
    label: "Klanten & werk",
    sub: "7 tools  ·  diensten, reviews, offertes",
  },
  {
    label: "Financiën",
    sub: "5 tools  ·  uitbetalingen, BTW, escrow",
  },
  {
    label: "Bedrijf & tools",
    sub: "10 tools  ·  personeel, materialen, GPS",
  },
];

export default function ProfielPage() {
  const { name, specialty, role, activeView, setActiveView, logout } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);

  const isVakman = mounted ? activeView === "vakman" : true;
  const hasBoth = role === "beide";

  const displayName = mounted && name ? name : "Dossche";
  const initial = displayName.charAt(0).toUpperCase();
  const sub = mounted && specialty ? specialty : "Amsterdam · Loodgieter sinds '19";

  function handleLogout() {
    logout();
    router.replace("/onboarding");
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>
            Profiel
          </h2>
          <div style={{ display: "flex", gap: 6 }}>
            <Link href="/meldingen" style={{ textDecoration: "none" }}>
              <button className="touch-scale" style={{
                padding: 8, background: "transparent",
                border: "0.5px solid #E5DDD0", borderRadius: 99,
                color: "#1A1D1A", cursor: "pointer", display: "flex", alignItems: "center",
              }} aria-label="Meldingen">
                <Bell size={15} />
              </button>
            </Link>
            <Link href="/instellingen" style={{ textDecoration: "none" }}>
              <button className="touch-scale" style={{
                padding: 8, background: "transparent",
                border: "0.5px solid #E5DDD0", borderRadius: 99,
                color: "#1A1D1A", cursor: "pointer", display: "flex", alignItems: "center",
              }} aria-label="Instellingen">
                <Settings size={15} />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28">

        {/* ── Avatar + name ── */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#2B4030",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SERIF, fontSize: 24, color: "#F5EFE5",
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{displayName}</p>
            <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>{sub}</p>
          </div>
        </div>

        {/* ── Role toggle (only for beide) ── */}
        {hasBoth && (
          <button
            className="touch-scale"
            onClick={() => setActiveView(isVakman ? "klant" : "vakman")}
            style={{
              width: "100%", display: "flex", padding: 3,
              background: "#EDE4D2", borderRadius: 99,
              border: "none", cursor: "pointer", marginBottom: 22,
            }}
          >
            <span style={{
              flex: 1, textAlign: "center", fontSize: 12, padding: "6px 0",
              color: isVakman ? "#5C5C56" : "#F5EFE5",
              background: isVakman ? "transparent" : "#2B4030",
              borderRadius: 99, fontWeight: isVakman ? 400 : 500,
              fontFamily: "'Inter', sans-serif",
            }}>Klant</span>
            <span style={{
              flex: 1, textAlign: "center", fontSize: 12, padding: "6px 0",
              color: isVakman ? "#F5EFE5" : "#5C5C56",
              background: isVakman ? "#2B4030" : "transparent",
              borderRadius: 99, fontWeight: isVakman ? 500 : 400,
              fontFamily: "'Inter', sans-serif",
            }}>Vakman</span>
          </button>
        )}

        {/* ── Stats row ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          paddingTop: 16, paddingBottom: 16, marginBottom: 22,
          borderTop: "0.5px solid #E5DDD0", borderBottom: "0.5px solid #E5DDD0",
        }}>
          <div style={{ textAlign: "center", borderRight: "0.5px solid #E5DDD0" }}>
            <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#1A1D1A" }}>47</p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Klussen</p>
          </div>
          <div style={{ textAlign: "center", borderRight: "0.5px solid #E5DDD0" }}>
            <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#2B4030" }}>€2.840</p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Deze maand</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#1A1D1A" }}>
              4,9 <span style={{ fontSize: 13, color: "#C97A4D" }}>★</span>
            </p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Rating</p>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 10, padding: "10px 14px", marginBottom: 22,
        }}>
          <Search size={16} style={{ color: "#8A8A83", flexShrink: 0 }} />
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#8A8A83" }}>
            Zoek in alle tools…
          </span>
        </div>

        {/* ── "Vandaag" label ── */}
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: "0 0 10px" }}>
          Vandaag
        </p>

        {/* ── Vandaag expanded group ── */}
        <div style={{
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 12, overflow: "hidden", marginBottom: 16,
        }}>
          {VANDAAG_TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="touch-scale"
                style={{
                  display: "flex", alignItems: "center",
                  padding: "13px 14px",
                  borderBottom: i < VANDAAG_TOOLS.length - 1 ? "0.5px solid #E5DDD0" : "none",
                  textDecoration: "none",
                }}
              >
                <Icon size={18} style={{ color: "#1A1D1A", marginRight: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{tool.label}</p>
                  <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>{tool.sub}</p>
                </div>
                {tool.badge && (
                  <span style={{
                    fontFamily: SERIF, fontSize: 13, color: "#2B4030", marginRight: 8,
                  }}>{tool.badge}</span>
                )}
                <ChevronRight size={14} style={{ color: "#8A8A83", flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>

        {/* ── Collapsed groups ── */}
        {GROEPEN.map((g, i) => (
          <div
            key={g.label}
            className="touch-scale"
            style={{
              background: "#FBF7F0", border: "0.5px solid #E5DDD0",
              borderRadius: 12, padding: 14,
              marginBottom: i < GROEPEN.length - 1 ? 8 : 0,
              display: "flex", alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: SERIF, fontSize: 15, margin: 0, color: "#1A1D1A" }}>{g.label}</p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>{g.sub}</p>
            </div>
            <ChevronRight size={14} style={{ color: "#8A8A83", flexShrink: 0 }} />
          </div>
        ))}

        {/* ── Uitloggen ── */}
        <button
          className="touch-scale"
          onClick={handleLogout}
          style={{
            width: "100%", marginTop: 24, padding: "12px 0",
            background: "transparent", border: "0.5px solid #E5DDD0",
            borderRadius: 10, fontSize: 13, color: "#8A8A83",
            cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}
        >
          Uitloggen
        </button>
      </div>
    </div>
  );
}
