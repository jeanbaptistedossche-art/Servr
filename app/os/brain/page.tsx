"use client";

import { useState } from "react";
import OSTopbar from "@/components/os/OSTopbar";

interface FileEntry { name: string; modified: string; size?: string }
interface Folder { name: string; icon: string; files: FileEntry[] }

const FOLDERS: Folder[] = [
  {
    name: "shared", icon: "📁",
    files: [
      { name: "servr-context.md", modified: "2h ago", size: "4.2KB" },
      { name: "jean-baptiste-prefs.md", modified: "1d ago", size: "1.8KB" },
      { name: "weekly-summary.md", modified: "6h ago", size: "3.1KB" },
    ],
  },
  {
    name: "agents", icon: "📁",
    files: [
      { name: "ceo-agent.md", modified: "3d ago", size: "2.4KB" },
      { name: "cto-agent.md", modified: "3d ago", size: "2.1KB" },
      { name: "scout-agent.md", modified: "3d ago", size: "1.9KB" },
      { name: "validator-agent.md", modified: "3d ago", size: "2.2KB" },
      { name: "marketing-agent.md", modified: "2d ago", size: "1.7KB" },
      { name: "finance-agent.md", modified: "2d ago", size: "1.8KB" },
      { name: "ops-agent.md", modified: "2d ago", size: "1.6KB" },
      { name: "trust-agent.md", modified: "2d ago", size: "1.5KB" },
      { name: "growth-agent.md", modified: "1d ago", size: "1.9KB" },
      { name: "legal-agent.md", modified: "1d ago", size: "2.0KB" },
      { name: "launch-agent.md", modified: "4d ago", size: "3.2KB" },
      { name: "dna-agent.md", modified: "5d ago", size: "2.8KB" },
    ],
  },
  {
    name: "sessions", icon: "📁",
    files: [
      { name: "2026-06-10-morning-brief.md", modified: "8h ago", size: "5.1KB" },
      { name: "2026-06-09-competitor-scan.md", modified: "1d ago", size: "3.8KB" },
      { name: "2026-06-08-sprint-review.md", modified: "2d ago", size: "7.2KB" },
      { name: "2026-06-07-war-room.md", modified: "3d ago", size: "12.4KB" },
    ],
  },
];

const SAMPLE_CONTENT: Record<string, string> = {
  "servr-context.md": `# Servr Context

[LEARN: Servr is een marketplace voor lokale dienstverleners in België]

## Wat is Servr?
Servr verbindt klanten met vakmannen in hun buurt. Focus op:
- Loodgieters, elektriciens, schilders
- Directe boeking + betaling
- GPS tracking + kwaliteitsgarantie

## Kernmetrics
- WAT (Weekly Active Tradespeople): 14 actief
- MRR: €4.820
- Conversieratio: 3.2%
- Health score: 87%

## Huidige prioriteiten
1. GPS tracking live (67% klaar)
2. Win-back campagne voor churned users
3. Werkspot response strategie (E4 alert)`,
  "jean-baptiste-prefs.md": `# Jean-Baptiste Preferences

## Communicatiestijl
- Direct en bondig — geen AI-clichés
- Bullets boven paragrafen
- Altijd eindigen met concrete volgende stap

## Beslissingspatroon
- Data-gedreven maar intuïtie als checksum
- Snelle iteraties boven perfectie
- Delegeer technische details aan CTO

## Werktijden
- Actief 08:00 — 23:00
- Morning brief: 08:00 sharp
- War room: wanneer nodig`,
};

export default function BrainPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ shared: true, agents: false, sessions: false });
  const [selectedFile, setSelectedFile] = useState<{ folder: string; file: FileEntry } | null>({
    folder: "shared", file: FOLDERS[0].files[0],
  });
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [content, setContent] = useState(SAMPLE_CONTENT["servr-context.md"] ?? "");
  const [saved, setSaved] = useState(true);

  const handleFileSelect = (folder: string, file: FileEntry) => {
    setSelectedFile({ folder, file });
    setContent(SAMPLE_CONTENT[file.name] ?? `# ${file.name.replace(".md", "")}\n\nInhoud wordt geladen...`);
    setSaved(true);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    setSaved(false);
    // Debounce save simulation
    setTimeout(() => setSaved(true), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <OSTopbar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT — File tree */}
        <div style={{
          width: 220, flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,.06)",
          overflowY: "auto", padding: "14px 10px",
        }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".14em", marginBottom: 10, paddingLeft: 4 }}>KNOWLEDGE BASE</div>

          {FOLDERS.map(folder => (
            <div key={folder.name} style={{ marginBottom: 4 }}>
              <button onClick={() => setExpanded(e => ({ ...e, [folder.name]: !e[folder.name] }))} style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                background: "none", border: "none", cursor: "pointer", padding: "6px 8px",
                borderRadius: 6, color: "rgba(238,240,255,.7)", fontSize: 13, fontWeight: 600,
                textAlign: "left",
              }}>
                <span style={{ fontSize: 10, color: "rgba(238,240,255,.35)", transform: expanded[folder.name] ? "rotate(90deg)" : "none", transition: "transform .2s", display: "inline-block" }}>›</span>
                <span>{folder.icon}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{folder.name}</span>
              </button>

              {expanded[folder.name] && (
                <div style={{ marginLeft: 16, marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  {folder.files.map(file => {
                    const isActive = selectedFile?.file.name === file.name;
                    return (
                      <button key={file.name} onClick={() => handleFileSelect(folder.name, file)} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                        borderRadius: 6, border: "none", background: isActive ? "rgba(72,128,255,.1)" : "none",
                        cursor: "pointer", color: isActive ? "#eef0ff" : "rgba(238,240,255,.5)",
                        fontSize: 11, textAlign: "left", width: "100%",
                        borderLeft: isActive ? "2px solid #4880ff" : "2px solid transparent",
                      }}>
                        <span>📄</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>{file.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Obsidian link */}
          <div style={{ marginTop: 16, padding: "0 4px" }}>
            <a href="obsidian://open?vault=knowledge" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
              background: "rgba(144,96,255,.08)", border: "1px solid rgba(144,96,255,.2)",
              borderRadius: 8, textDecoration: "none", fontSize: 11,
              color: "#9060ff", fontFamily: "'JetBrains Mono', monospace",
            }}>
              🧬 Open in Obsidian
            </a>
          </div>
        </div>

        {/* RIGHT — Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedFile && (
            <>
              {/* Editor topbar */}
              <div style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.4)" }}>
                  {selectedFile.folder} / <span style={{ color: "#eef0ff" }}>{selectedFile.file.name}</span>
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: saved ? "#00e096" : "#ffaa30" }}>
                    {saved ? "● Saved" : "○ Saving..."}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(238,240,255,.3)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {content.split(/\s+/).length} words · {selectedFile.file.modified}
                  </span>
                  {["preview", "raw"].map(m => (
                    <button key={m} onClick={() => setViewMode(m as "preview" | "raw")} style={{
                      padding: "4px 10px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      background: viewMode === m ? "rgba(72,128,255,.15)" : "rgba(255,255,255,.04)",
                      border: `1px solid ${viewMode === m ? "rgba(72,128,255,.3)" : "rgba(255,255,255,.08)"}`,
                      borderRadius: 6, color: viewMode === m ? "#4880ff" : "rgba(238,240,255,.4)",
                      cursor: "pointer", textTransform: "capitalize",
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
                {viewMode === "raw" ? (
                  <textarea value={content} onChange={e => handleContentChange(e.target.value)} style={{
                    width: "100%", height: "100%", background: "transparent", border: "none", outline: "none",
                    color: "#eef0ff", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7,
                    resize: "none",
                  }} />
                ) : (
                  <div style={{ maxWidth: 720, color: "#eef0ff", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.75 }}>
                    {content.split("\n").map((line, i) => {
                      if (line.startsWith("# ")) return <h1 key={i} style={{ fontSize: 22, fontWeight: 800, margin: "0 0 12px", color: "#eef0ff" }}>{line.slice(2)}</h1>;
                      if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: 16, fontWeight: 700, margin: "20px 0 8px", color: "rgba(238,240,255,.8)" }}>{line.slice(3)}</h2>;
                      if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 14, fontWeight: 600, margin: "14px 0 6px", color: "rgba(238,240,255,.7)" }}>{line.slice(4)}</h3>;
                      if (line.startsWith("- ")) return <li key={i} style={{ fontSize: 13, color: "rgba(238,240,255,.75)", marginBottom: 4, marginLeft: 16 }}>{line.slice(2)}</li>;
                      if (line.match(/^\d+\. /)) return <li key={i} style={{ fontSize: 13, color: "rgba(238,240,255,.75)", marginBottom: 4, marginLeft: 16 }}>{line.replace(/^\d+\. /, "")}</li>;
                      if (line.includes("[LEARN:")) return <div key={i} style={{ background: "rgba(0,224,150,.08)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "#00e096", fontFamily: "'JetBrains Mono', monospace", margin: "8px 0" }}>{line}</div>;
                      if (line === "") return <br key={i} />;
                      return <p key={i} style={{ fontSize: 13, color: "rgba(238,240,255,.7)", margin: "0 0 6px" }}>{line}</p>;
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
