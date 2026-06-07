"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";

type Signal = {
  datum: string;
  signaal: string;
  ernst: number;
  bron: string;
  actie: string;
};

function parseSignals(md: string): Signal[] {
  const section = md.split("## MARKET_SIGNALS")[1]?.split(/^## /m)[0] ?? "";
  return section
    .split("\n")
    .filter(l => l.startsWith("|") && !l.match(/\|[-:]+\|/) && !l.includes("Datum"))
    .map(row => {
      const cells = row.split("|").map(c => c.trim()).filter(Boolean);
      return {
        datum:   cells[0] ?? "",
        signaal: cells[1] ?? "",
        ernst:   parseInt(cells[2] ?? "0") || 0,
        bron:    cells[3] ?? "",
        actie:   cells[4] ?? "",
      };
    })
    .filter(s => s.signaal);
}

function ErnstBadge({ score }: { score: number }) {
  const config =
    score >= 4 ? { bg: "#7f1d1d33", color: "#f87171", label: "Hoog" } :
    score === 3 ? { bg: "#78350f33", color: "#f59e0b", label: "Middel" } :
                  { bg: "#14532d33", color: "#4ade80", label: "Laag" };

  return (
    <div style={{
      width: 52, height: 52, borderRadius: 10,
      background: config.bg, border: `1px solid ${config.color}33`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: config.color, lineHeight: 1 }}>
        {score || "?"}
      </span>
      <span style={{ fontSize: 8, color: config.color, fontWeight: 600, letterSpacing: "0.04em" }}>
        {config.label.toUpperCase()}
      </span>
    </div>
  );
}

export default function MarketPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"all" | "high" | "med" | "low">("all");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/os/backlog");
    const md  = await res.text();
    setSignals(parseSignals(md));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = signals.filter(s =>
    filter === "all" ? true :
    filter === "high" ? s.ernst >= 4 :
    filter === "med"  ? s.ernst === 3 :
    s.ernst <= 2
  ).sort((a, b) => b.ernst - a.ernst);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 820 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>Market Signals</h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>
            {signals.length} signalen · run DAILY BRIEF om te updaten
          </p>
        </div>
        <button onClick={load} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 7,
          background: "#111", border: "1px solid #1f1f1f",
          color: "#9ca3af", fontSize: 12, cursor: "pointer",
        }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[
          { key: "all",  label: "Alle" },
          { key: "high", label: "🔴 Hoog (4-5)" },
          { key: "med",  label: "🟡 Middel (3)" },
          { key: "low",  label: "🟢 Laag (1-2)" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as typeof filter)} style={{
            padding: "6px 12px", borderRadius: 6,
            background: filter === f.key ? "#1e3a8a" : "#111",
            color: filter === f.key ? "#93c5fd" : "#6b7280",
            fontSize: 12, fontWeight: filter === f.key ? 600 : 400,
            cursor: "pointer",
            border: `1px solid ${filter === f.key ? "#1e3a8a" : "#1f1f1f"}`,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: "#4b5563", fontSize: 13 }}>Laden…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "#111", border: "1px solid #1f1f1f", borderRadius: 10,
          padding: 40, textAlign: "center",
        }}>
          <p style={{ fontSize: 24, marginBottom: 12 }}>📡</p>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            Nog geen market signals — run <strong style={{ color: "#2563eb" }}>DAILY BRIEF</strong> om Scout te activeren
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((s, i) => (
            <div key={i} style={{
              background: "#111", border: "1px solid #1f1f1f",
              borderRadius: 10, padding: 16, display: "flex", gap: 14,
              animation: "fadeIn 0.2s ease",
            }}>
              <ErnstBadge score={s.ernst} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb", margin: 0, lineHeight: 1.4 }}>
                    {s.signaal}
                  </p>
                  <span style={{ fontSize: 10, color: "#4b5563", whiteSpace: "nowrap", marginTop: 2 }}>
                    {s.datum}
                  </span>
                </div>

                {s.bron && s.bron !== "—" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <ExternalLink size={10} style={{ color: "#4b5563" }} />
                    {s.bron.startsWith("http") ? (
                      <a href={s.bron} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2563eb", textDecoration: "none" }}>
                        {s.bron.replace(/^https?:\/\//, "").split("/")[0]}
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: "#6b7280" }}>{s.bron}</span>
                    )}
                  </div>
                )}

                {s.actie && s.actie !== "—" && (
                  <div style={{
                    background: s.actie.toLowerCase().includes("ja") || s.actie.toLowerCase().includes("yes")
                      ? "#7f1d1d22" : "#14532d22",
                    border: `1px solid ${s.actie.toLowerCase().includes("ja") ? "#f8717133" : "#4ade8033"}`,
                    borderRadius: 6, padding: "4px 10px", display: "inline-block",
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: s.actie.toLowerCase().includes("ja") ? "#f87171" : "#4ade80",
                    }}>
                      Actie: {s.actie}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
