"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Save, RefreshCw, Code, Eye } from "lucide-react";
import { useStateFile } from "@/hooks/useStateFile";

export default function StatePage() {
  const { content, loading, saving, saved, onChange, save, reload } = useStateFile();
  const [view, setView] = useState<"preview" | "editor">("preview");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "20px 24px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#f9fafb", margin: 0 }}>State</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "#111111", border: "1px solid #1f2937", borderRadius: 7, overflow: "hidden" }}>
            {([["preview", Eye, "Preview"], ["editor", Code, "Raw"]] as const).map(([v, Icon, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", border: "none",
                background: view === v ? "#1e3a5f" : "transparent",
                color: view === v ? "#3b82f6" : "#6b7280",
                fontSize: 12, cursor: "pointer",
              }}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
          <button onClick={reload} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "#111111", border: "1px solid #1f2937", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
            <RefreshCw size={12} />
          </button>
          <button onClick={() => save(content)} disabled={saving} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 7, border: "none",
            background: saved ? "#064e3b" : "#1d4ed8",
            color: saved ? "#10b981" : "#fff",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            <Save size={12} />
            {saved ? "Opgeslagen!" : saving ? "Opslaan…" : "Opslaan"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="os-scroll" style={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <div style={{ color: "#4b5563", fontSize: 13 }}>Laden…</div>
        ) : view === "preview" ? (
          <div style={{
            background: "#111111", borderRadius: 10, padding: "24px 28px",
            fontSize: 13, lineHeight: 1.8, color: "#d1d5db",
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", borderBottom: "1px solid #1f2937", paddingBottom: 8, margin: "0 0 16px" }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 600, color: "#e5e7eb", margin: "20px 0 8px" }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db", margin: "14px 0 6px" }}>{children}</h3>,
                p: ({ children }) => <p style={{ margin: "0 0 10px", color: "#d1d5db" }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: "4px 0 10px" }}>{children}</ul>,
                li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: "#fff" }}>{children}</strong>,
                code: ({ children }) => <code style={{ background: "#1f2937", padding: "1px 5px", borderRadius: 4, fontSize: 11, fontFamily: "monospace", color: "#93c5fd" }}>{children}</code>,
                table: ({ children }) => <table style={{ borderCollapse: "collapse", width: "100%", margin: "10px 0" }}>{children}</table>,
                th: ({ children }) => <th style={{ padding: "6px 12px", background: "#1f2937", color: "#9ca3af", textAlign: "left", borderBottom: "1px solid #374151" }}>{children}</th>,
                td: ({ children }) => <td style={{ padding: "6px 12px", borderBottom: "1px solid #1a1a1a", color: "#d1d5db" }}>{children}</td>,
                hr: () => <hr style={{ border: "none", borderTop: "1px solid #1f2937", margin: "16px 0" }} />,
                blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid #3b82f6", paddingLeft: 12, margin: "8px 0", color: "#9ca3af" }}>{children}</blockquote>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={e => onChange(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%", height: "100%", minHeight: 400,
              background: "#111111", border: "1px solid #1f2937",
              borderRadius: 10, color: "#9ca3af",
              fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              padding: "16px 20px", outline: "none", resize: "none",
              lineHeight: 1.7,
            }}
          />
        )}
      </div>
    </div>
  );
}
