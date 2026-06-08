"use client";

import { useState, useEffect, useCallback } from "react";

type FileEntry = { path: string; mtime: number };

function buildTree(files: FileEntry[]) {
  const tree: Record<string, FileEntry[]> = {};
  for (const f of files) {
    const parts = f.path.split("/");
    const dir = parts.slice(0, -1).join("/") || "root";
    if (!tree[dir]) tree[dir] = [];
    tree[dir].push(f);
  }
  return tree;
}

export default function BrainPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/os/knowledge/list")
      .then(r => r.json())
      .then(d => setFiles(d.files ?? []))
      .catch(() => {});
  }, []);

  const loadFile = useCallback((path: string) => {
    setSelected(path);
    setEditing(false);
    fetch(`/api/os/knowledge?file=${encodeURIComponent(path)}`)
      .then(r => r.json())
      .then(d => setContent(d.content ?? ""))
      .catch(() => setContent("(Fout bij laden)"));
  }, []);

  const saveFile = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/os/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: selected, content: editContent, append: false }),
    });
    setContent(editContent);
    setEditing(false);
    setSaving(false);
  };

  const filtered = search
    ? files.filter(f => f.path.toLowerCase().includes(search.toLowerCase()))
    : files;

  const tree = buildTree(filtered);
  const dirs = Object.keys(tree).sort();

  const agentColor: Record<string, string> = {
    ceo: "#7c3aed", cto: "#059669", scout: "#d97706", validator: "#dc2626",
    cfo: "#0ea5e9", ux: "#ec4899", growth: "#f59e0b", legal: "#6366f1",
    security: "#ef4444", ops: "#14b8a6", dna: "#a855f7", scenario: "#64748b", launch: "#22c55e",
    shared: "#6b7280", sessions: "#374151",
  };

  function getColor(path: string) {
    const seg = path.split("/")[1] ?? path.split("/")[0];
    return agentColor[seg] ?? "#4b5563";
  }

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: "#080808", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid #1a1a1a",
        background: "#111", display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <span style={{ fontSize: 18 }}>🧠</span>
        <div>
          <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 14 }}>Agent Brain</p>
          <p style={{ margin: 0, color: "#4b5563", fontSize: 11 }}>
            {files.length} bestanden · Collectief geheugen van alle agents
          </p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek in knowledge base..."
          style={{
            marginLeft: "auto", background: "#1a1a1a", border: "1px solid #1f2937",
            borderRadius: 6, padding: "6px 12px", color: "#e5e7eb", fontSize: 12,
            outline: "none", width: 220,
          }}
        />
        <a
          href="obsidian://open?vault=knowledge"
          style={{
            padding: "6px 12px", borderRadius: 6, border: "1px solid #374151",
            color: "#9ca3af", fontSize: 11, textDecoration: "none",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          Open in Obsidian ↗
        </a>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* File tree */}
        <div style={{
          width: 220, flexShrink: 0, borderRight: "1px solid #1a1a1a",
          overflowY: "auto", padding: "12px 8px",
        }}>
          {dirs.map(dir => (
            <div key={dir} style={{ marginBottom: 12 }}>
              <p style={{
                margin: "0 0 4px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                color: "#374151", textTransform: "uppercase",
              }}>
                📁 {dir === "root" ? "/" : dir}
              </p>
              {tree[dir].map(f => {
                const name = f.path.split("/").pop() ?? f.path;
                const isSelected = selected === f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => loadFile(f.path)}
                    style={{
                      width: "100%", textAlign: "left", background: isSelected ? "#1a1a1a" : "transparent",
                      border: "none", borderRadius: 5, padding: "5px 8px", cursor: "pointer",
                      color: isSelected ? "#fff" : "#6b7280",
                      borderLeft: isSelected ? `2px solid ${getColor(f.path)}` : "2px solid transparent",
                      fontSize: 11, display: "block",
                      transition: "all 0.1s",
                    }}
                  >
                    {name.replace(".md", "")}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Content panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selected ? (
            <>
              <div style={{
                padding: "10px 20px", borderBottom: "1px solid #1a1a1a",
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
              }}>
                <span style={{ color: getColor(selected), fontSize: 12 }}>●</span>
                <span style={{ color: "#9ca3af", fontSize: 12, fontFamily: "monospace" }}>{selected}</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  {editing ? (
                    <>
                      <button
                        onClick={saveFile}
                        disabled={saving}
                        style={{
                          padding: "4px 12px", borderRadius: 5, border: "none",
                          background: "#1d4ed8", color: "#fff", fontSize: 11, cursor: "pointer",
                        }}
                      >
                        {saving ? "..." : "💾 Opslaan"}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        style={{
                          padding: "4px 12px", borderRadius: 5, border: "1px solid #374151",
                          background: "none", color: "#6b7280", fontSize: 11, cursor: "pointer",
                        }}
                      >
                        Annuleer
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setEditContent(content); setEditing(true); }}
                      style={{
                        padding: "4px 12px", borderRadius: 5, border: "1px solid #374151",
                        background: "none", color: "#6b7280", fontSize: 11, cursor: "pointer",
                      }}
                    >
                      ✏️ Bewerken
                    </button>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
                {editing ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    style={{
                      width: "100%", height: "100%", background: "#0d0d0d",
                      border: "1px solid #1f2937", borderRadius: 8,
                      color: "#e5e7eb", fontSize: 12, fontFamily: "monospace",
                      padding: "16px", outline: "none", resize: "none", lineHeight: 1.6,
                    }}
                  />
                ) : (
                  <pre style={{
                    color: "#d1d5db", fontSize: 12, lineHeight: 1.7,
                    whiteSpace: "pre-wrap", fontFamily: "system-ui, sans-serif", margin: 0,
                  }}>
                    {content || "(Leeg bestand)"}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 12, color: "#374151",
            }}>
              <span style={{ fontSize: 48 }}>🧠</span>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Selecteer een bestand</p>
              <p style={{ margin: 0, fontSize: 11, color: "#374151", textAlign: "center", maxWidth: 300 }}>
                Agents schrijven hier automatisch naar als ze iets leren via [LEARN:] tags.
                Jij kan ook direct bewerken.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
