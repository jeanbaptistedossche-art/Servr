"use client";

import { useState } from "react";
import OSTopbar from "@/components/os/OSTopbar";
import { AGENTS, AGENT_KEYS, AgentKey } from "@/lib/os/agentConfig";

const STATUS_COLORS: Record<string, string> = {
  LIVE: "#00e096", BUILDING: "#4880ff", SCANNING: "#00dcff", IDLE: "rgba(238,240,255,.3)",
};

const AGENT_LOGS: Record<AgentKey, string[]> = {
  ceo:        ["09:12 — Weekly KPI synthesis started", "09:08 — Finance brief received", "08:55 — Scout alert: Werkspot E4", "08:30 — Morning brief completed", "08:00 — Day initialized"],
  cto:        ["09:15 — GPS tracking deploy — 67% done", "09:02 — Vercel build triggered", "08:50 — GitHub push: feature/gps-v2", "08:40 — Sentry: 0 new errors", "08:20 — Supabase schema migrated"],
  scout:      ["09:14 — Scanning Werkspot pricing page", "09:10 — Reddit r/Belgium: 3 mentions", "09:05 — LinkedIn: Fixly funding article", "08:58 — Twitter: #vakman trending", "08:45 — ProductHunt: no new competitors"],
  validator:  ["Yesterday 17:30 — Escrow scored 21/25 PAST", "Yesterday 15:00 — GPS tracking: AANPASSING NODIG", "Yesterday 12:00 — Win-back RED TEAM done", "Monday — Onboarding flow: PAST 23/25", "Sunday — Pricing model: AANPASSING NODIG"],
  marketing:  ["09:13 — TikTok reel boosted €50/day", "09:09 — Instagram story scheduled 12:00", "09:05 — Facebook: CTR 3.8% ↑", "09:00 — AdCreative: 3 new variants", "08:45 — TikTok: 2.4k views detected"],
  data:       ["09:11 — Churn model: 3 users flagged", "09:07 — PostHog: funnel report ready", "09:00 — Stripe MRR: €4,820", "08:50 — Mixpanel: retention 68%", "08:30 — Supabase: 847 active users"],
  finance:    ["09:12 — Exact Online: 14 invoices synced", "09:08 — Stripe: webhook processed €340", "09:00 — Runway: cash flow 18 months", "08:55 — Vic.ai: 0 anomalies", "08:45 — Daily P&L: +€247"],
  operations: ["09:15 — Health check passed (5m interval)", "09:10 — Vercel: 99.8% uptime", "09:05 — Supabase: 12ms avg query", "09:00 — BetterUptime: all green", "08:55 — PagerDuty: 0 incidents"],
  trust:      ["09:00 — Passive monitoring active", "08:30 — Stripe Radar: 0 blocks", "08:00 — Sardine: 0 suspicious users", "Yesterday — Sift: 1 false positive cleared", "Monday — No incidents this week"],
  meta:       ["Sunday 20:00 — Scheduled: prompt review", "Last Sunday — Scout recall improved +23%", "2 weeks ago — Marketing tone updated", "3 weeks ago — Validator scorecard refined", "1 month ago — CEO delegation logic improved"],
};

export default function AgentsPage() {
  const [selected, setSelected] = useState<AgentKey>("ceo");
  const [chatInput, setChatInput] = useState("");
  const agent = AGENTS[selected];
  const logs = AGENT_LOGS[selected];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <OSTopbar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 0 }}>
        {/* LEFT — Agent roster */}
        <div style={{
          width: 300, flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,.06)",
          overflowY: "auto", padding: "16px 12px",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".14em", fontWeight: 700, marginBottom: 4, paddingLeft: 4 }}>
            AGENT ROSTER — 8 AGENTS
          </div>

          {AGENT_KEYS.map(key => {
            const ag = AGENTS[key];
            const isActive = ag.status !== "IDLE";
            const isSelected = selected === key;
            return (
              <div key={key} onClick={() => setSelected(key)} style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: isSelected ? "rgba(72,128,255,.1)" : "rgba(5,8,20,.88)",
                border: `1px solid ${isSelected ? "rgba(72,128,255,.3)" : "rgba(255,255,255,.06)"}`,
                cursor: "pointer", opacity: isActive ? 1 : 0.55,
                transition: "all .3s cubic-bezier(.2,.7,.3,1)",
                position: "relative", overflow: "hidden",
              }}>
                {/* Top color bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: ag.color }} />

                {/* Scan line for active agents */}
                {isActive && (
                  <div className="os-scan-line" style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 1,
                    background: `linear-gradient(90deg, transparent, ${ag.color}88, transparent)`,
                    pointerEvents: "none",
                  }} />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: `${ag.color}22`,
                    border: `1px solid ${ag.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, flexShrink: 0,
                  }}>{ag.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#eef0ff" }}>{ag.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(238,240,255,.4)" }}>{ag.description}</div>
                  </div>
                  <span style={{
                    fontSize: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: ".1em",
                    color: STATUS_COLORS[ag.status],
                    background: `${STATUS_COLORS[ag.status]}18`,
                    border: `1px solid ${STATUS_COLORS[ag.status]}33`,
                    borderRadius: 4, padding: "2px 6px", flexShrink: 0,
                  }}>{ag.status}</span>
                </div>

                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.4)", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ag.currentTask}
                </div>

                {/* Progress bar */}
                {ag.progress > 0 && (
                  <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 2, marginBottom: 6, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${ag.progress}%`, borderRadius: 2,
                      background: `linear-gradient(90deg, ${ag.color}88, ${ag.color})`,
                      transition: "width 1s ease",
                    }} />
                  </div>
                )}

                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.28)" }}>
                  {ag.logLine}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT — Agent detail */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `${agent.color}22`,
              border: `2px solid ${agent.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>{agent.emoji}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#eef0ff", letterSpacing: "-.02em" }}>{agent.name} Agent</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: ".12em",
                  color: STATUS_COLORS[agent.status],
                  background: `${STATUS_COLORS[agent.status]}18`,
                  border: `1px solid ${STATUS_COLORS[agent.status]}33`,
                  borderRadius: 4, padding: "3px 8px",
                }}>{agent.status}</span>
                <span style={{ fontSize: 11, color: "rgba(238,240,255,.4)" }}>{agent.description}</span>
              </div>
            </div>
          </div>

          {/* Current task */}
          <div className="os-card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".12em", marginBottom: 8 }}>CURRENT TASK</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#eef0ff", marginBottom: 10 }}>{agent.currentTask}</div>
            {agent.progress > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(238,240,255,.4)", fontFamily: "'JetBrains Mono', monospace" }}>Progress</span>
                  <span style={{ fontSize: 11, color: agent.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{agent.progress}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${agent.progress}%`, background: `linear-gradient(90deg, ${agent.color}88, ${agent.color})`, borderRadius: 2, transition: "width 1s ease" }} />
                </div>
              </>
            )}
          </div>

          {/* Tools + platforms */}
          {(agent.aiTools.length > 0 || agent.platforms.length > 0) && (
            <div className="os-card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".12em", marginBottom: 10 }}>CONNECTED TOOLS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[...agent.aiTools, ...agent.platforms].map(tool => (
                  <span key={tool} style={{
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                    color: agent.color,
                    background: `${agent.color}12`,
                    border: `1px solid ${agent.color}30`,
                    borderRadius: 6, padding: "4px 10px",
                  }}>{tool}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recent log */}
          <div className="os-card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".12em", marginBottom: 12 }}>RECENT LOG</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? agent.color : "rgba(238,240,255,.15)", flexShrink: 0, marginTop: 5 }} />
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: i === 0 ? "rgba(238,240,255,.8)" : "rgba(238,240,255,.4)", lineHeight: 1.4 }}>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance this week */}
          <div className="os-card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".12em", marginBottom: 12 }}>PERFORMANCE THIS WEEK</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "Tasks done", value: "47", color: "#00e096" },
                { label: "Accuracy", value: "94%", color: agent.color },
                { label: "Avg response", value: "1.2s", color: "#4880ff" },
                { label: "Escalations", value: "2", color: "#ffaa30" },
              ].map(stat => (
                <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.35)" }}>{stat.label}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct message */}
          <div className="os-card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".12em", marginBottom: 10 }}>DIRECT MESSAGE</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={`Direct message to ${agent.name}…`}
                style={{
                  flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#eef0ff",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              />
              <button className="os-btn-primary" style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}>Send ↗</button>
            </div>
          </div>
        </div>
      </div>

      {/* War room bar */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,.06)",
        background: "rgba(0,0,7,.85)", backdropFilter: "blur(20px)",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace', color: 'rgba(238,240,255,.3)", letterSpacing: ".12em" }}>WAR ROOM</span>
        <input
          placeholder="Talk to all agents simultaneously…"
          style={{
            flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 12, padding: "10px 16px", fontSize: 13, color: "#eef0ff",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        />
        <button className="os-btn-primary" style={{ padding: "10px 18px", fontSize: 13, borderRadius: 10, flexShrink: 0 }}>Execute ⚡</button>
      </div>
    </div>
  );
}
