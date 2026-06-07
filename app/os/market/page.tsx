"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { useBacklog } from "@/hooks/useBacklog";
import type { TableRow } from "@/lib/os/parseMarkdownTable";

function ernstConfig(score: number) {
  if (score >= 4) return { bg: "#7f1d1d33", border: "#ef444433", color: "#f87171", label: "HOOG" };
  if (score === 3) return { bg: "#78350f33", border: "#f59e0b33", color: "#f59e0b", label: "MIDDEL" };
  return { bg: "#064e3b33", border: "#10b98133", color: "#10b981", label: "LAAG" };
}

function SignalCard({ row }: { row: TableRow }) {
  const [actionOn, setActionOn] = useState(false);

  const datum   = row["Datum"]    ?? row["datum"]   ?? "";
  const signaal = row["Signaal"]  ?? row["signaal"] ?? Object.values(row)[1] ?? "";
  const ernst   = parseInt(row["Ernst"] ?? row["ernst"] ?? "0");
  const bron    = row["Bron"]     ?? row["bron"]    ?? "";
  const actie   = row["Actie nodig?"] ?? row["Actie"] ?? row["actie"] ?? "";

  const ec = ernstConfig(ernst);

  return (
    <div style={{
      background: "#111111", border: `1px solid #1f2937`,
      borderRadius: 10, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 10,
      animation: "os-fadeup 0.2s ease",
      position: "relative", overflow: "hidden",
    }}>
      {/* Top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: ec.color, opacity: 0.5 }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", margin: 0, lineHeight: 1.4, flex: 1 }}>
          {signaal || "—"}
        </p>
        {ernst > 0 && (
          <span style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700,
            padding: "3px 8px", borderRadius: 6,
            background: ec.bg, border: `1px solid ${ec.border}`,
            color: ec.color, letterSpacing: "0.04em",
          }}>
            {ernst}/5 · {ec.label}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {bron && bron !== "—" && (
          <a
            href={bron.startsWith("http") ? bron : undefined}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, padding: "2px 8px", borderRadius: 99,
              background: "#1e3a8a22", border: "1px solid #1e3a8a",
              color: "#3b82f6", textDecoration: "none",
            }}
          >
            <ExternalLink size={10} />
            {bron.replace(/^https?:\/\//, "").split("/")[0] || bron}
          </a>
        )}

        {actie && actie !== "—" && (
          <button
            onClick={() => setActionOn(s => !s)}
            style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 99,
              background: actionOn ? "#064e3b33" : "transparent",
              border: `1px solid ${actionOn ? "#10b981" : "#374151"}`,
              color: actionOn ? "#10b981" : "#6b7280",
              cursor: "pointer",
            }}
          >
            {actionOn ? "✓ Actie gepland" : "Actie nodig?"}
          </button>
        )}

        {datum && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#374151" }}>{datum}</span>
        )}
      </div>
    </div>
  );
}

export default function MarketPage() {
  const { data, loading, refresh } = useBacklog(60000);
  const [filter, setFilter] = useState<"all" | "high" | "med" | "low">("all");

  const signals = data.marketSignals.filter(s => {
    const ernst = parseInt(s["Ernst"] ?? s["ernst"] ?? "0");
    if (filter === "high") return ernst >= 4;
    if (filter === "med")  return ernst === 3;
    if (filter === "low")  return ernst <= 2;
    return true;
  }).sort((a, b) => {
    const ea = parseInt(a["Ernst"] ?? a["ernst"] ?? "0");
    const eb = parseInt(b["Ernst"] ?? b["ernst"] ?? "0");
    return eb - ea;
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "20px 24px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#f9fafb", margin: 0 }}>Market Signals</h1>
          <p style={{ fontSize: 11, color: "#4b5563", margin: "3px 0 0" }}>
            {data.marketSignals.length} signalen · run DAILY BRIEF om te updaten
          </p>
        </div>
        <button onClick={refresh} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, background: "#111111", border: "1px solid #1f2937", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexShrink: 0 }}>
        {[["all","Alle"],["high","🔴 Hoog"],["med","🟡 Middel"],["low","🟢 Laag"]] .map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k as typeof filter)} style={{
            padding: "5px 12px", borderRadius: 99,
            background: filter === k ? "#1e3a5f" : "#111111",
            color: filter === k ? "#3b82f6" : "#6b7280",
            fontSize: 11, fontWeight: filter === k ? 600 : 400, cursor: "pointer",
            border: `1px solid ${filter === k ? "#1e3a8a" : "#1f2937"}`,
          }}>
            {l}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="os-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ color: "#4b5563", fontSize: 13 }}>Laden…</div>
        ) : signals.length === 0 ? (
          <div style={{
            background: "#111111", border: "1px solid #1f2937", borderRadius: 10,
            padding: 40, textAlign: "center",
          }}>
            <p style={{ fontSize: 24, marginBottom: 10 }}>📡</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              Geen market signals — run <strong style={{ color: "#3b82f6" }}>DAILY BRIEF</strong> om Scout te activeren
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {signals.map((s, i) => <SignalCard key={i} row={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
