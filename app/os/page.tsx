"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Zap, Search, BarChart2, FileText, ShieldAlert, Calendar } from "lucide-react";

type Sitrep = {
  id: string;
  timestamp: string;
  command: string;
  output: string;
  agents: string[];
  streaming: boolean;
};

const QUICK_ACTIONS = [
  { label: "DAILY BRIEF",   icon: Calendar,   cmd: "DAILY BRIEF" },
  { label: "AUDIT",         icon: Search,     cmd: "AUDIT" },
  { label: "SPRINT",        icon: BarChart2,  cmd: "SPRINT" },
  { label: "RED TEAM",      icon: ShieldAlert,cmd: "RED TEAM" },
  { label: "SHIP IT: ...",  icon: Zap,        cmd: "SHIP IT: " },
  { label: "WAR ROOM: ...", icon: FileText,   cmd: "WAR ROOM: " },
];

function detectAgents(text: string): string[] {
  const agents: string[] = [];
  if (/CEO|sitrep|📊/i.test(text))       agents.push("🧠 CEO");
  if (/CTO|bouw|code|PR|deploy/i.test(text)) agents.push("⚙️ CTO");
  if (/scout|markt|concurrent/i.test(text))  agents.push("🔍 Scout");
  if (/validator|scorecard|fit/i.test(text)) agents.push("✅ Validator");
  return agents.length ? agents : ["🧠 CEO"];
}

// Simple backlog preview parsed from raw markdown text
type BacklogRow = { prio: string; taak: string; aanvrager: string; status: string };

function parseSprintQueue(backlogMd: string): BacklogRow[] {
  const section = backlogMd.split("## SPRINT_QUEUE")[1]?.split("##")[0] ?? "";
  const rows = section.split("\n").filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("Prio"));
  return rows.slice(0, 5).map(row => {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    return { prio: cells[0] ?? "", taak: cells[1] ?? "", aanvrager: cells[2] ?? "", status: "queue" };
  });
}

function parseDone(backlogMd: string): BacklogRow[] {
  const section = backlogMd.split("## DONE")[1]?.split("##")[0] ?? "";
  const rows = section.split("\n").filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("Taak"));
  return rows.slice(0, 3).map(row => {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    return { prio: "—", taak: cells[0] ?? "", aanvrager: cells[2] ?? "", status: "done" };
  });
}

export default function OSPage() {
  const [command, setCommand] = useState("");
  const [sitreps, setSitreps] = useState<Sitrep[]>([]);
  const [loading, setLoading] = useState(false);
  const [backlogMd, setBacklogMd] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Load backlog for preview
  useEffect(() => {
    fetch("/api/os/backlog").then(r => r.text()).then(setBacklogMd).catch(() => {});
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sitreps]);

  async function runCommand(cmd: string) {
    if (!cmd.trim() || loading) return;
    setCommand("");
    setLoading(true);

    const id = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

    // Activate agents in sidebar
    const activeAgents = ["🧠 CEO"];
    if (/DAILY BRIEF|AUDIT/i.test(cmd)) activeAgents.push("🔍 Scout", "✅ Validator");
    if (/SHIP IT|AUDIT/i.test(cmd))     activeAgents.push("⚙️ CTO");
    if (/RED TEAM/i.test(cmd))          activeAgents.push("✅ Validator");

    window.__osSetAgents?.([
      { emoji: "🧠", name: "CEO",       status: "active", lastRun: timestamp },
      { emoji: "⚙️", name: "CTO",       status: /SHIP IT|AUDIT/i.test(cmd) ? "active" : "idle", lastRun: /SHIP IT|AUDIT/i.test(cmd) ? timestamp : "—" },
      { emoji: "🔍", name: "Scout",     status: /DAILY BRIEF|AUDIT/i.test(cmd) ? "active" : "idle", lastRun: /DAILY BRIEF|AUDIT/i.test(cmd) ? timestamp : "—" },
      { emoji: "✅", name: "Validator", status: /DAILY BRIEF|AUDIT|RED TEAM|SHIP IT/i.test(cmd) ? "active" : "idle", lastRun: /DAILY BRIEF|AUDIT|RED TEAM|SHIP IT/i.test(cmd) ? timestamp : "—" },
    ]);

    const newSitrep: Sitrep = { id, timestamp, command: cmd, output: "", agents: activeAgents, streaming: true };
    setSitreps(prev => [...prev, newSitrep]);

    try {
      const res = await fetch("/api/os/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setSitreps(prev => prev.map(s => s.id === id ? { ...s, output: full } : s));
      }

      const finalAgents = detectAgents(full);
      setSitreps(prev => prev.map(s => s.id === id ? { ...s, output: full, agents: finalAgents, streaming: false } : s));

      // Mark all agents done
      window.__osSetAgents?.([
        { emoji: "🧠", name: "CEO",       status: "done", lastRun: timestamp },
        { emoji: "⚙️", name: "CTO",       status: /SHIP IT|AUDIT/i.test(cmd) ? "done" : "idle", lastRun: /SHIP IT|AUDIT/i.test(cmd) ? timestamp : "—" },
        { emoji: "🔍", name: "Scout",     status: /DAILY BRIEF|AUDIT/i.test(cmd) ? "done" : "idle", lastRun: /DAILY BRIEF|AUDIT/i.test(cmd) ? timestamp : "—" },
        { emoji: "✅", name: "Validator", status: /DAILY BRIEF|AUDIT|RED TEAM|SHIP IT/i.test(cmd) ? "done" : "idle", lastRun: /DAILY BRIEF|AUDIT|RED TEAM|SHIP IT/i.test(cmd) ? timestamp : "—" },
      ]);

      // Refresh backlog preview
      fetch("/api/os/backlog").then(r => r.text()).then(setBacklogMd).catch(() => {});

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Onbekende fout";
      setSitreps(prev => prev.map(s => s.id === id ? { ...s, output: `❌ Fout: ${msg}`, streaming: false } : s));
      window.__osSetAgents?.([
        { emoji: "🧠", name: "CEO",       status: "idle", lastRun: timestamp },
        { emoji: "⚙️", name: "CTO",       status: "idle", lastRun: "—" },
        { emoji: "🔍", name: "Scout",     status: "idle", lastRun: "—" },
        { emoji: "✅", name: "Validator", status: "idle", lastRun: "—" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const queueRows = parseSprintQueue(backlogMd);
  const doneRows  = parseDone(backlogMd);
  const allRows   = [...queueRows, ...doneRows];

  return (
    <div style={{ padding: "24px 28px", maxWidth: 860, margin: "0 auto" }}>

      {/* Command Center */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          Command Center
        </p>

        {/* Input */}
        <div style={{
          display: "flex", gap: 8,
          background: "#111", border: "1px solid #1f1f1f",
          borderRadius: 10, padding: "10px 14px",
          marginBottom: 12,
          transition: "border-color 0.15s",
        }}
          onFocus={() => {}}
        >
          <span style={{ color: "#2563eb", fontSize: 14, fontFamily: "monospace", paddingTop: 1 }}>›</span>
          <input
            ref={inputRef}
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runCommand(command)}
            placeholder="Type een commando… (DAILY BRIEF, SHIP IT: feature, AUDIT, SPRINT, RED TEAM)"
            disabled={loading}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 13, color: "#e5e7eb", fontFamily: "monospace",
            }}
          />
          <button
            onClick={() => runCommand(command)}
            disabled={loading || !command.trim()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 7, border: "none",
              background: loading || !command.trim() ? "#1f1f1f" : "#2563eb",
              color: loading || !command.trim() ? "#6b7280" : "#fff",
              fontSize: 12, fontWeight: 600, cursor: loading || !command.trim() ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            <Send size={12} />
            Run
          </button>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {QUICK_ACTIONS.map(({ label, icon: Icon, cmd }) => (
            <button
              key={label}
              onClick={() => {
                if (cmd.endsWith(": ")) {
                  setCommand(cmd);
                  inputRef.current?.focus();
                } else {
                  runCommand(cmd);
                }
              }}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 6,
                background: "#111", border: "1px solid #1f1f1f",
                color: "#9ca3af", fontSize: 11, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* SITREP Feed */}
      {sitreps.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            SITREP Feed
          </p>

          {sitreps.map(s => (
            <div key={s.id} style={{
              background: "#111", border: "1px solid #1f1f1f",
              borderRadius: 10, marginBottom: 12, overflow: "hidden",
              animation: "fadeIn 0.3s ease",
            }}>
              {/* Card header */}
              <div style={{
                padding: "10px 16px",
                borderBottom: "1px solid #1f1f1f",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4b5563" }}>
                  {s.timestamp}
                </span>
                <span style={{
                  fontFamily: "monospace", fontSize: 12, color: "#2563eb",
                  background: "#1e3a8a22", padding: "2px 8px", borderRadius: 4,
                }}>
                  {s.command}
                </span>
                <div style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
                  {s.agents.map(a => (
                    <span key={a} style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 4,
                      background: "#1f2937", color: "#9ca3af", fontWeight: 500,
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Output */}
              <div style={{ padding: "16px 20px" }}>
                {s.streaming && !s.output ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#4b5563" }}>Agents denken</span>
                    <span style={{ fontSize: 18, color: "#2563eb", letterSpacing: 2, animation: "pulse 1s infinite" }}>...</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: "#d1d5db" }}>
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "16px 0 8px" }}>{children}</h1>,
                        h2: ({ children }) => <h2 style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb", margin: "14px 0 6px" }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db", margin: "12px 0 4px" }}>{children}</h3>,
                        p: ({ children }) => <p style={{ margin: "6px 0", color: "#d1d5db" }}>{children}</p>,
                        li: ({ children }) => <li style={{ marginBottom: 4, color: "#d1d5db" }}>{children}</li>,
                        ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: "6px 0" }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: "6px 0" }}>{children}</ol>,
                        strong: ({ children }) => <strong style={{ color: "#fff", fontWeight: 600 }}>{children}</strong>,
                        code: ({ children }) => <code style={{ background: "#1f2937", padding: "1px 5px", borderRadius: 4, fontSize: 11, fontFamily: "monospace", color: "#93c5fd" }}>{children}</code>,
                        blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid #2563eb", paddingLeft: 12, margin: "8px 0", color: "#9ca3af" }}>{children}</blockquote>,
                        hr: () => <hr style={{ border: "none", borderTop: "1px solid #1f1f1f", margin: "12px 0" }} />,
                      }}
                    >
                      {s.output}
                    </ReactMarkdown>
                    {s.streaming && (
                      <span style={{ display: "inline-block", width: 8, height: 14, background: "#2563eb", borderRadius: 2, marginLeft: 2, animation: "pulse 0.8s infinite" }} />
                    )}
                  </div>
                )}
              </div>

              {/* Recommended next step — extracted from output */}
              {!s.streaming && s.output.includes("VOLGENDE STAP") && (
                <div style={{
                  padding: "10px 20px",
                  borderTop: "1px solid #1f1f1f",
                  background: "#0f1f3d",
                }}>
                  <p style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, margin: 0 }}>
                    ➡️ {s.output.match(/VOLGENDE STAP[\s\S]*?\n([^\n]+)/)?.[1]?.trim() ?? "Zie SITREP hierboven"}
                  </p>
                </div>
              )}
            </div>
          ))}
          <div ref={feedEndRef} />
        </div>
      )}

      {/* Backlog preview */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            Sprint Queue
          </p>
          <a href="/os/backlog" style={{ fontSize: 11, color: "#2563eb", textDecoration: "none" }}>
            Open full backlog →
          </a>
        </div>

        <div style={{
          background: "#111", border: "1px solid #1f1f1f",
          borderRadius: 10, overflow: "hidden",
        }}>
          {allRows.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#4b5563", fontSize: 13 }}>
              Sprint queue leeg — geef een commando om te starten
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1f1f1f" }}>
                  {["Prio", "Taak", "Aanvrager", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < allRows.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{row.prio}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#e5e7eb", maxWidth: 280 }}>{row.taak}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{row.aanvrager}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                        background: row.status === "done" ? "#14532d33" : "#1e3a8a22",
                        color:      row.status === "done" ? "#22c55e"   : "#60a5fa",
                      }}>
                        {row.status === "done" ? "🟢 Done" : "🔴 In queue"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
