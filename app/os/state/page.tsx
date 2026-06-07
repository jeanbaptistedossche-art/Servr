"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Save } from "lucide-react";

type Section = { title: string; content: string };

function parseSections(md: string): Section[] {
  const lines = md.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace("## ", ""), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections;
}

function parseTechDebt(content: string) {
  return content.split("\n")
    .filter(l => l.startsWith("-"))
    .map(l => l.replace(/^-\s*/, ""));
}

function parseOpenBeslissingen(content: string) {
  return content.split("\n")
    .filter(l => l.match(/^\s*- \[/))
    .map(l => ({ done: l.includes("[x]"), text: l.replace(/^\s*- \[.\]\s*/, "") }));
}

const URGENCY_COLOR = (t: string) => {
  if (t.includes("nog te inventariseren") || !t.trim()) return "#6b7280";
  return "#d1d5db";
};

export default function StatePage() {
  const [md, setMd]       = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/os/state");
    const text = await res.text();
    setMd(text);
    setSections(parseSections(text));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveState() {
    setSaving(true);
    await fetch("/api/os/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: md }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const get = (title: string) => sections.find(s => s.title.trim().toLowerCase().includes(title.toLowerCase()))?.content.trim() ?? "";

  const lastUpdate    = get("Laatste update");
  const beslissingen  = parseOpenBeslissingen(get("Open beslissingen"));
  const sprintFocus   = get("Huidige sprint focus");
  const techDebt      = parseTechDebt(get("Tech debt"));
  const markt         = parseTechDebt(get("Marktinzichten"));
  const roadmap       = get("Roadmap scores");

  if (loading) return (
    <div style={{ padding: 32, color: "#4b5563", fontSize: 13 }}>Laden…</div>
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 820 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>State</h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>
            Laatste update: <span style={{ color: "#9ca3af" }}>{lastUpdate || "—"}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 7,
            background: "#111", border: "1px solid #1f1f1f",
            color: "#9ca3af", fontSize: 12, cursor: "pointer",
          }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={saveState} disabled={saving} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 7,
            background: saved ? "#14532d" : "#1e3a8a",
            border: "none", color: saved ? "#22c55e" : "#93c5fd",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            <Save size={12} />
            {saved ? "Opgeslagen!" : saving ? "Opslaan…" : "Opslaan"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>

        {/* Sprint Focus */}
        <Card title="🎯 Huidige Sprint Focus">
          <p style={{ fontSize: 13, color: "#d1d5db", margin: 0, lineHeight: 1.6 }}>
            {sprintFocus || "Geen sprint focus ingesteld"}
          </p>
        </Card>

        {/* Open Beslissingen */}
        <Card title="🔴 Open Beslissingen">
          {beslissingen.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Geen open beslissingen</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {beslissingen.map((b, i) => (
                <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={b.done}
                    onChange={() => {
                      // Toggle checkbox in md
                      const updated = md.replace(
                        b.done ? `- [x] ${b.text}` : `- [ ] ${b.text}`,
                        b.done ? `- [ ] ${b.text}` : `- [x] ${b.text}`
                      );
                      setMd(updated);
                      setSections(parseSections(updated));
                    }}
                    style={{ marginTop: 2, accentColor: "#2563eb" }}
                  />
                  <span style={{ fontSize: 13, color: b.done ? "#6b7280" : "#d1d5db", textDecoration: b.done ? "line-through" : "none" }}>
                    {b.text}
                  </span>
                </label>
              ))}
            </div>
          )}
        </Card>

        {/* Tech Debt */}
        <Card title="⚠️ Tech Debt">
          {techDebt.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Geen tech debt geregistreerd</p>
          ) : (
            <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
              {techDebt.map((t, i) => (
                <li key={i} style={{ fontSize: 13, color: URGENCY_COLOR(t), marginBottom: 6, lineHeight: 1.5 }}>{t}</li>
              ))}
            </ul>
          )}
        </Card>

        {/* Marktinzichten */}
        <Card title="🔍 Marktinzichten">
          {markt.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Nog geen marktinzichten — run DAILY BRIEF</p>
          ) : (
            <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
              {markt.map((m, i) => (
                <li key={i} style={{ fontSize: 13, color: "#d1d5db", marginBottom: 6, lineHeight: 1.5 }}>{m}</li>
              ))}
            </ul>
          )}
        </Card>

        {/* Roadmap Scores */}
        {roadmap && (
          <Card title="📊 Roadmap Scores">
            <pre style={{ fontSize: 11, color: "#6b7280", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
              {roadmap}
            </pre>
          </Card>
        )}

        {/* Raw editor */}
        <Card title="📝 Raw STATE.md">
          <textarea
            value={md}
            onChange={e => { setMd(e.target.value); setSections(parseSections(e.target.value)); }}
            style={{
              width: "100%", minHeight: 200, background: "#0d0d0d",
              border: "1px solid #1f1f1f", borderRadius: 6,
              color: "#9ca3af", fontSize: 11, fontFamily: "monospace",
              padding: "10px 12px", resize: "vertical", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1f1f1f", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #1f1f1f" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
