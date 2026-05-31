"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, Settings, Search, ChevronRight,
  LayoutDashboard, Calendar, Clock, QrCode,
  Home, Heart, History, FileText, CreditCard, Wallet,
} from "lucide-react";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

// ── Vakman tools ──────────────────────────────────────────────
const VANDAAG_TOOLS = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard",        sub: "Overzicht en omzet" },
  { href: "/agenda",        icon: Calendar,        label: "Agenda",            sub: "3 boekingen vandaag", badge: "€290" },
  { href: "/urenregistratie", icon: Clock,          label: "Urenregistratie",   sub: "Timer per klus" },
  { href: "/inchecken",     icon: QrCode,          label: "QR Check-in",      sub: "Aanwezigheid" },
];

const VAKMAN_GROEPEN = [
  { label: "Klanten & werk", sub: "7 tools  ·  diensten, reviews, offertes" },
  { label: "Financiën",       sub: "5 tools  ·  uitbetalingen, BTW, escrow" },
  { label: "Bedrijf & tools", sub: "10 tools  ·  personeel, materialen, GPS" },
];

// ── Klant tools ───────────────────────────────────────────────
const MIJN_VAKMEN_TOOLS = [
  { href: "/favorieten",   icon: Heart,    label: "Favorieten",           sub: "Opgeslagen vakmensen" },
  { href: "/klussen",      icon: History,  label: "Boekingsgeschiedenis", sub: "Alle afgeronde klussen" },
  { href: "/documenten",   icon: FileText, label: "Facturen",             sub: "Download & bekijk" },
];

const BETALEN_TOOLS = [
  { href: "/betalingen",  icon: CreditCard, label: "Betaalmethoden", sub: "iDEAL · Bancontact · Kaart" },
  { href: "/betaalplan",  icon: Wallet,     label: "Betaalplan",      sub: "Gespreide betaling" },
];

// ── Shared header ─────────────────────────────────────────────
function ProfielHeader() {
  return (
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
            }}>
              <Bell size={15} />
            </button>
          </Link>
          <Link href="/instellingen" style={{ textDecoration: "none" }}>
            <button className="touch-scale" style={{
              padding: 8, background: "transparent",
              border: "0.5px solid #E5DDD0", borderRadius: 99,
              color: "#1A1D1A", cursor: "pointer", display: "flex", alignItems: "center",
            }}>
              <Settings size={15} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Tool list group ───────────────────────────────────────────
function ToolGroup({ tools }: { tools: { href: string; icon: React.ElementType; label: string; sub: string; badge?: string }[] }) {
  return (
    <div style={{
      background: "#FBF7F0", border: "0.5px solid #E5DDD0",
      borderRadius: 12, overflow: "hidden",
    }}>
      {tools.map((tool, i) => {
        const Icon = tool.icon;
        return (
          <Link key={tool.href} href={tool.href} className="touch-scale" style={{
            display: "flex", alignItems: "center",
            padding: "13px 14px",
            borderBottom: i < tools.length - 1 ? "0.5px solid #E5DDD0" : "none",
            textDecoration: "none",
          }}>
            <Icon size={18} style={{ color: "#1A1D1A", marginRight: 12, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{tool.label}</p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>{tool.sub}</p>
            </div>
            {tool.badge && (
              <span style={{ fontFamily: SERIF, fontSize: 13, color: "#2B4030", marginRight: 8 }}>
                {tool.badge}
              </span>
            )}
            <ChevronRight size={14} style={{ color: "#8A8A83", flexShrink: 0 }} />
          </Link>
        );
      })}
    </div>
  );
}

// ── Vakman profiel ────────────────────────────────────────────
function VakmanProfiel({ name, role, setActiveView, onLogout }: {
  name: string; role: string | null;
  setActiveView: (v: "klant" | "vakman") => void;
  onLogout: () => void;
}) {
  const initial = name.charAt(0).toUpperCase();
  const hasBoth = role === "beide";

  return (
    <div className="px-5 pb-28">
      {/* Avatar + name */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#2B4030",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: SERIF, fontSize: 24, color: "#F5EFE5", flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{name}</p>
          <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>Amsterdam · Loodgieter sinds &apos;19</p>
        </div>
      </div>

      {/* Role toggle */}
      {hasBoth && (
        <button className="touch-scale" onClick={() => setActiveView("klant")} style={{
          width: "100%", display: "flex", padding: 3,
          background: "#EDE4D2", borderRadius: 99,
          border: "none", cursor: "pointer", marginBottom: 22,
        }}>
          <span style={{
            flex: 1, textAlign: "center", fontSize: 12, padding: "6px 0",
            color: "#5C5C56", fontFamily: "'Inter', sans-serif",
          }}>Klant</span>
          <span style={{
            flex: 1, textAlign: "center", fontSize: 12, padding: "6px 0",
            color: "#F5EFE5", background: "#2B4030", borderRadius: 99,
            fontWeight: 500, fontFamily: "'Inter', sans-serif",
          }}>Vakman</span>
        </button>
      )}

      {/* Stats */}
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

      {/* Search */}
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

      {/* Vandaag label */}
      <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: "0 0 10px" }}>
        Vandaag
      </p>

      {/* Vandaag expanded group */}
      <div style={{ marginBottom: 16 }}>
        <ToolGroup tools={VANDAAG_TOOLS} />
      </div>

      {/* Collapsed groups */}
      {VAKMAN_GROEPEN.map((g, i) => (
        <div key={g.label} className="touch-scale" style={{
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 12, padding: 14,
          marginBottom: i < VAKMAN_GROEPEN.length - 1 ? 8 : 0,
          display: "flex", alignItems: "center", cursor: "pointer",
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: SERIF, fontSize: 15, margin: 0, color: "#1A1D1A" }}>{g.label}</p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>{g.sub}</p>
          </div>
          <ChevronRight size={14} style={{ color: "#8A8A83", flexShrink: 0 }} />
        </div>
      ))}

      <button className="touch-scale" onClick={onLogout} style={{
        width: "100%", marginTop: 24, padding: "12px 0",
        background: "transparent", border: "0.5px solid #E5DDD0",
        borderRadius: 10, fontSize: 13, color: "#8A8A83",
        cursor: "pointer", fontFamily: "'Inter', sans-serif",
      }}>
        Uitloggen
      </button>
    </div>
  );
}

// ── Klant profiel ─────────────────────────────────────────────
function KlantProfiel({ name, address, role, setActiveView, onLogout }: {
  name: string; address: string; role: string | null;
  setActiveView: (v: "klant" | "vakman") => void;
  onLogout: () => void;
}) {
  const initial = name.charAt(0).toUpperCase();
  const hasBoth = role === "beide";

  return (
    <div className="px-5 pb-28">
      {/* Avatar + name */}
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#2B4030",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: SERIF, fontSize: 24, color: "#F5EFE5", flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{name}</p>
          <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>{address || "Amsterdam"}</p>
        </div>
      </div>

      {/* Role toggle */}
      {hasBoth && (
        <button className="touch-scale" onClick={() => setActiveView("vakman")} style={{
          width: "100%", display: "flex", padding: 3,
          background: "#EDE4D2", borderRadius: 99,
          border: "none", cursor: "pointer", marginBottom: 22,
        }}>
          <span style={{
            flex: 1, textAlign: "center", fontSize: 12, padding: "6px 0",
            color: "#F5EFE5", background: "#2B4030", borderRadius: 99,
            fontWeight: 500, fontFamily: "'Inter', sans-serif",
          }}>Klant</span>
          <span style={{
            flex: 1, textAlign: "center", fontSize: 12, padding: "6px 0",
            color: "#5C5C56", fontFamily: "'Inter', sans-serif",
          }}>Vakman</span>
        </button>
      )}

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        paddingTop: 16, paddingBottom: 16, marginBottom: 22,
        borderTop: "0.5px solid #E5DDD0", borderBottom: "0.5px solid #E5DDD0",
      }}>
        <div style={{ textAlign: "center", borderRight: "0.5px solid #E5DDD0" }}>
          <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#1A1D1A" }}>12</p>
          <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Boekingen</p>
        </div>
        <div style={{ textAlign: "center", borderRight: "0.5px solid #E5DDD0" }}>
          <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#1A1D1A" }}>€470</p>
          <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Uitgegeven</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#1A1D1A" }}>
            4,8 <span style={{ fontSize: 13, color: "#C97A4D" }}>★</span>
          </p>
          <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Jouw score</p>
        </div>
      </div>

      {/* Mijn woning focus-card */}
      <div style={{
        background: "#1A1D1A", color: "#F5EFE5",
        borderRadius: 14, padding: 18, marginBottom: 22,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "#2B3A30",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Home size={20} style={{ color: "#F5EFE5" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: SERIF, fontSize: 17, margin: "0 0 2px" }}>Mijn woning</p>
          <p style={{ fontSize: 12, color: "#B8B4A8", margin: 0 }}>
            {address || "Amsterdam"} · Informatie voor vakmensen
          </p>
        </div>
        <ChevronRight size={14} style={{ color: "#8A8A83", flexShrink: 0 }} />
      </div>

      {/* Mijn vakmen group */}
      <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: "0 0 10px" }}>
        Mijn vakmen
      </p>
      <div style={{ marginBottom: 16 }}>
        <ToolGroup tools={MIJN_VAKMEN_TOOLS} />
      </div>

      {/* Betalen group */}
      <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: "0 0 10px" }}>
        Betalen
      </p>
      <div style={{ marginBottom: 16 }}>
        <ToolGroup tools={BETALEN_TOOLS} />
      </div>

      <button className="touch-scale" onClick={onLogout} style={{
        width: "100%", marginTop: 8, padding: "12px 0",
        background: "transparent", border: "0.5px solid #E5DDD0",
        borderRadius: 10, fontSize: 13, color: "#8A8A83",
        cursor: "pointer", fontFamily: "'Inter', sans-serif",
      }}>
        Uitloggen
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ProfielPage() {
  const { name, address, role, activeView, setActiveView, logout } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);

  const isVakman = mounted ? activeView === "vakman" : false;
  const displayName = (mounted && name) ? name : "Dossche";
  const displayAddress = (mounted && address) ? address : "Amsterdam";

  function handleLogout() {
    logout();
    router.replace("/onboarding");
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>
      <ProfielHeader />
      {isVakman
        ? <VakmanProfiel name={displayName} role={role} setActiveView={setActiveView} onLogout={handleLogout} />
        : <KlantProfiel name={displayName} address={displayAddress} role={role} setActiveView={setActiveView} onLogout={handleLogout} />
      }
    </div>
  );
}
