"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const TABS = [
  { key: "SPRINT_QUEUE",    label: "Sprint Queue" },
  { key: "APPROVED_TASKS",  label: "Approved" },
  { key: "IN_PROGRESS",     label: "In Progress" },
  { key: "MARKET_SIGNALS",  label: "Market Signals" },
  { key: "DONE",            label: "Done" },
  { key: "TECH_DEBT",       label: "Tech Debt" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function parseSection(md: string, sectionKey: string): string[][] {
  const section = md.split(`## ${sectionKey}`)[1]?.split(/^## /m)[0] ?? "";
  const rows = section
    .split("\n")
    .filter(l => l.startsWith("|") && !l.match(/^[\s|:-]+$/) && !l.match(/\|[-:]+\|/));
  return rows.map(row =>
    row.split("|").map(c => c.trim()).filter(Boolean)
  );
}

function parseHeaders(md: string, sectionKey: string): string[] {
  const section = md.split(`## ${sectionKey}`)[1]?.split(/^## /m)[0] ?? "";
  const headerLine = section.split("\n").find(l => l.startsWith("|") && !l.match(/\|[-:]+\|/));
  if (!headerLine) return [];
  return headerLine.split("|").map(c => c.trim()).filter(Boolean);
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "open":     { bg: "#1e3a8a22", color: "#60a5fa" },
  "actief":   { bg: "#78350f22", color: "#f59e0b" },
  "gedaan":   { bg: "#14532d33", color: "#22c55e" },
  "hoog":     { bg: "#7f1d1d22", color: "#f87171" },
  "middel":   { bg: "#78350f22", color: "#f59e0b" },
  "laag":     { bg: "#14532d22", color: "#4ade80" },
};

function cellStyle(header: string, value: string) {
  const h = header.toLowerCase();
  if ((h.includes("ernst") || h.includes("urgentie")) && value) {
    const n = parseInt(value);
    if (n >= 4) return STATUS_COLORS["hoog"];
    if (n === 3) return STATUS_COLORS["middel"];
    if (n <= 2) return STATUS_COLORS["laag"];
  }
  const lower = value.toLowerCase();
  return STATUS_COLORS[lower] ?? null;
}

export default function BacklogPage() {
  const [md, setMd]       = useState("");
  const [tab, setTab]     = useState<TabKey>("SPRINT_QUEUE");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/os/backlog");
      setMd(await res.text());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const headers = parseHeaders(md, tab);
  const rows    = parseSection(md, tab);
  const dataRows = rows.filter((_, i) => i > 0 || !headers.length ? true : i >= 0);

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>Backlog</h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>
            Alle taken, signalen en uitgevoerd werk
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 7,
            background: "#111", border: "1px solid #1f1f1f",
            color: "#9ca3af", fontSize: 12, cursor: "pointer",
          }}
        >
          <RefreshCw size={12} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#111", borderRadius: 8, padding: 4, border: "1px solid #1f1f1f", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "6px 12px", borderRadius: 6, border: "none",
            background: tab === t.key ? "#1e3a8a" : "transparent",
            color: tab === t.key ? "#93c5fd" : "#6b7280",
            fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
            cursor: "pointer", whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 10, overflow: "auto" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#4b5563", fontSize: 13 }}>
            Laden…
          </div>
        ) : dataRows.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#4b5563", fontSize: 13 }}>
            Niets in deze sectie
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {headers.length > 0 && (
              <thead>
                <tr style={{ borderBottom: "1px solid #1f1f1f" }}>
                  {headers.map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {dataRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < dataRows.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                  {row.map((cell, j) => {
                    const header = headers[j] ?? "";
                    const style = cellStyle(header, cell);
                    const isLink = cell.startsWith("http") || cell.startsWith("[");
                    return (
                      <td key={j} style={{ padding: "10px 16px", fontSize: 12, color: "#d1d5db", verticalAlign: "top", maxWidth: 300 }}>
                        {style ? (
                          <span style={{ ...style, padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            {cell}
                          </span>
                        ) : isLink ? (
                          <a href={cell.replace(/\[.*?\]\((.*?)\)/, "$1")} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>
                            {cell.replace(/\[.*?\]\(.*?\)/, m => m.match(/\[(.*?)\]/)?.[1] ?? m)}
                          </a>
                        ) : (
                          <span style={{ color: j === 0 ? "#9ca3af" : "#d1d5db" }}>{cell || "—"}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
