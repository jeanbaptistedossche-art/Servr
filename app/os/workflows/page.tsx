"use client";

import { useState } from "react";
import OSTopbar from "@/components/os/OSTopbar";

type WorkflowStatus = "running" | "scheduled" | "paused";

interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  agent: string;
  agentColor: string;
  trigger: string;
  lastRun: string;
  nextRun: string;
  steps: string[];
  logs: { time: string; result: string; duration: string }[];
}

const WORKFLOWS: Workflow[] = [
  {
    id: "winback", name: "Win-back Campaign", status: "running", agent: "Data", agentColor: "#9060ff",
    trigger: "Weekly — Monday 09:00", lastRun: "Today 09:00", nextRun: "Next Monday 09:00",
    steps: ["Data Agent: identify churned users", "Marketing Agent: generate email copy", "Jasper: create personalized variants", "Send via Mailchimp"],
    logs: [
      { time: "Today 09:00", result: "✓ 23 users identified", duration: "1.2s" },
      { time: "Mon 09:00", result: "✓ 18 users identified", duration: "1.1s" },
      { time: "Mon -1w 09:00", result: "✓ 21 users targeted", duration: "1.4s" },
    ],
  },
  {
    id: "competitor", name: "Competitor Scan", status: "scheduled", agent: "Intelligence", agentColor: "#00dcff",
    trigger: "Daily — 04:00", lastRun: "Today 04:00", nextRun: "Tomorrow 04:00",
    steps: ["Scout: scan 6 competitor sources", "Alert if E3+ signal detected", "Write to STATE.md", "Push notification to CEO"],
    logs: [
      { time: "Today 04:00", result: "✓ E4 Werkspot detected", duration: "8.3s" },
      { time: "Yesterday 04:00", result: "✓ No new signals", duration: "7.1s" },
      { time: "2 days ago 04:00", result: "✓ Fixly article flagged", duration: "9.2s" },
    ],
  },
  {
    id: "morning", name: "Morning Brief", status: "scheduled", agent: "CEO + Intel", agentColor: "#4880ff",
    trigger: "Daily — 08:00", lastRun: "Today 08:00", nextRun: "Tomorrow 08:00",
    steps: ["Fetch overnight events", "Intelligence: summarize signals", "CEO: prioritize actions", "Generate daily brief PDF"],
    logs: [
      { time: "Today 08:00", result: "✓ Brief delivered", duration: "4.2s" },
      { time: "Yesterday 08:00", result: "✓ Brief delivered", duration: "3.8s" },
    ],
  },
  {
    id: "tiktok", name: "TikTok Auto-boost", status: "running", agent: "Marketing", agentColor: "#ff5faa",
    trigger: "Event: views > 500", lastRun: "Today 09:13", nextRun: "On trigger",
    steps: ["Monitor TikTok views", "If > 500: boost with €50/day budget", "AdCreative: generate variants", "Report to CEO"],
    logs: [
      { time: "Today 09:13", result: "✓ Boosted — 2.4k views", duration: "0.8s" },
      { time: "Yesterday 14:22", result: "✓ Boosted — 1.8k views", duration: "0.7s" },
    ],
  },
  {
    id: "health", name: "Health Monitor", status: "running", agent: "Operations", agentColor: "#4880ff",
    trigger: "Every 5 minutes", lastRun: "5m ago", nextRun: "In 5m",
    steps: ["Vercel: check uptime", "Supabase: query latency", "PagerDuty: check incidents", "Alert if threshold exceeded"],
    logs: [
      { time: "5m ago", result: "✓ All green", duration: "0.3s" },
      { time: "10m ago", result: "✓ All green", duration: "0.3s" },
      { time: "15m ago", result: "✓ All green", duration: "0.3s" },
    ],
  },
  {
    id: "meta", name: "Meta Prompt Update", status: "scheduled", agent: "Meta", agentColor: "rgba(238,240,255,.6)",
    trigger: "Weekly — Sunday 20:00", lastRun: "Last Sunday 20:00", nextRun: "Sunday 20:00",
    steps: ["Review all agent logs", "Score prompt performance", "Rewrite underperforming prompts", "Deploy new agent versions"],
    logs: [
      { time: "Last Sunday 20:00", result: "✓ Scout improved +23%", duration: "45s" },
      { time: "2 weeks ago", result: "✓ Marketing tone updated", duration: "38s" },
    ],
  },
  {
    id: "launch", name: "Launch Checker", status: "paused", agent: "Launch", agentColor: "#ffaa30",
    trigger: "Manual", lastRun: "3 days ago", nextRun: "On demand",
    steps: ["Run 47-point checklist", "Check all critical paths", "Validate Stripe + Supabase", "Generate go/no-go report"],
    logs: [
      { time: "3 days ago", result: "✓ 44/47 passed", duration: "2m 13s" },
    ],
  },
];

const STATUS_COLORS: Record<WorkflowStatus, string> = {
  running: "#00e096", scheduled: "#ffaa30", paused: "rgba(238,240,255,.3)",
};

export default function WorkflowsPage() {
  const [selected, setSelected] = useState<Workflow>(WORKFLOWS[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const handleRun = (id: string) => {
    setRunning(id);
    setTimeout(() => setRunning(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <OSTopbar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT — Workflow list */}
        <div style={{
          width: 280, flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,.06)",
          overflowY: "auto", padding: "14px 10px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".14em" }}>WORKFLOWS</span>
            <button onClick={() => setShowCreate(true)} style={{
              width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(72,128,255,.3)",
              background: "rgba(72,128,255,.1)", color: "#4880ff", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
            }}>+</button>
          </div>

          {WORKFLOWS.map(wf => {
            const isSelected = selected.id === wf.id;
            const isRunning = wf.status === "running";
            return (
              <div key={wf.id} onClick={() => setSelected(wf)} style={{
                padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                background: isSelected ? "rgba(72,128,255,.1)" : "rgba(5,8,20,.88)",
                border: `1px solid ${isSelected ? "rgba(72,128,255,.25)" : "rgba(255,255,255,.05)"}`,
                position: "relative", overflow: "hidden",
                transition: "all .3s cubic-bezier(.2,.7,.3,1)",
              }}>
                {/* Running border glow */}
                {isRunning && (
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
                    background: wf.agentColor, animation: "os-breathe 2s infinite",
                  }} />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[wf.status], flexShrink: 0, animation: isRunning ? "os-breathe 2s infinite" : "none" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#eef0ff", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wf.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: wf.agentColor }}>{wf.agent}</span>
                  <span style={{ color: "rgba(238,240,255,.28)" }}>{wf.trigger.split(" — ")[0]}</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(238,240,255,.28)", fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
                  Last: {wf.lastRun}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT — Workflow detail */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#eef0ff", letterSpacing: "-.02em" }}>{selected.name}</h2>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: ".1em",
                  color: STATUS_COLORS[selected.status],
                  background: `${STATUS_COLORS[selected.status]}18`,
                  border: `1px solid ${STATUS_COLORS[selected.status]}30`,
                  borderRadius: 4, padding: "3px 8px",
                }}>{selected.status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(238,240,255,.4)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                Trigger: {selected.trigger} · Agent: <span style={{ color: selected.agentColor }}>{selected.agent}</span>
              </div>
            </div>
            <button onClick={() => handleRun(selected.id)} className="os-btn-primary" style={{
              padding: "10px 20px", fontSize: 13, borderRadius: 10,
              opacity: running === selected.id ? .7 : 1,
            }}>
              {running === selected.id ? "Running..." : "Run now ▶"}
            </button>
            <button style={{
              padding: "10px 16px", fontSize: 13, background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: "rgba(238,240,255,.6)",
              cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {selected.status === "paused" ? "Resume" : "Pause"}
            </button>
          </div>

          {/* Flow diagram */}
          <div className="os-card" style={{ padding: "20px" }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".14em", marginBottom: 16 }}>FLOW</div>
            <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
              {/* Trigger */}
              <div style={{ flexShrink: 0, padding: "8px 14px", background: "rgba(72,128,255,.1)", border: "1px solid rgba(72,128,255,.25)", borderRadius: 8, fontSize: 12, color: "#4880ff", fontWeight: 600 }}>
                {selected.trigger.split(" — ")[0]} TRIGGER
              </div>
              {selected.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 28, height: 1, background: "rgba(255,255,255,.15)", position: "relative" }}>
                    <div style={{ position: "absolute", right: 0, top: -3, width: 6, height: 6, borderTop: "1px solid rgba(255,255,255,.2)", borderRight: "1px solid rgba(255,255,255,.2)", transform: "rotate(45deg)" }} />
                  </div>
                  <div style={{
                    padding: "8px 12px", background: "rgba(5,8,20,.88)", border: "1px solid rgba(255,255,255,.07)",
                    borderRadius: 8, fontSize: 11, color: "rgba(238,240,255,.7)", maxWidth: 140, lineHeight: 1.3,
                  }}>
                    <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: selected.agentColor, display: "block", marginBottom: 2 }}>STEP {i + 1}</span>
                    {step}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 28, height: 1, background: "rgba(255,255,255,.15)" }} />
                <div style={{ padding: "8px 14px", background: "rgba(0,224,150,.08)", border: "1px solid rgba(0,224,150,.2)", borderRadius: 8, fontSize: 12, color: "#00e096", fontWeight: 600 }}>OUTPUT</div>
              </div>
            </div>
          </div>

          {/* Execution log */}
          <div className="os-card" style={{ padding: "18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".14em", marginBottom: 14 }}>EXECUTION LOG</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selected.logs.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.35)", flexShrink: 0 }}>{log.time}</span>
                  <span style={{ fontSize: 12, color: "rgba(238,240,255,.7)", flex: 1 }}>{log.result}</span>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)" }}>{log.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create workflow modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,7,.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCreate(false)}>
          <div className="os-card" style={{ width: 480, padding: 28, position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(72,128,255,.5), transparent)" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#eef0ff" }}>New Workflow</h3>
            {["Workflow name", "Action description"].map(label => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.4)", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>{label.toUpperCase()}</label>
                {label.includes("description") ? (
                  <textarea rows={3} style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#eef0ff", fontFamily: "'Space Grotesk', sans-serif", resize: "none" }} />
                ) : (
                  <input style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#eef0ff", fontFamily: "'Space Grotesk', sans-serif" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="os-btn-primary" style={{ padding: "10px 20px", fontSize: 13, borderRadius: 10 }}>Create workflow</button>
              <button onClick={() => setShowCreate(false)} style={{ padding: "10px 16px", fontSize: 13, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: "rgba(238,240,255,.5)", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
