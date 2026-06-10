"use client";

export type StateKey = "idle" | "listening" | "thinking" | "speaking" | "executing";

const STATES: Record<StateKey, { dot: string; label: string; color: string }> = {
  idle:      { dot: "●", label: "READY",     color: "#4880ff" },
  listening: { dot: "◉", label: "LISTENING", color: "#00e096" },
  thinking:  { dot: "◌", label: "THINKING",  color: "#ffaa30" },
  speaking:  { dot: "◆", label: "SPEAKING",  color: "#00dcff" },
  executing: { dot: "▶", label: "EXECUTING", color: "#9060ff" },
};

export default function OSStateBadge({ state = "idle" }: { state?: StateKey }) {
  const cfg = STATES[state] ?? STATES.idle;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px",
      borderRadius: 20,
      background: "rgba(255,255,255,.04)",
      border: `1px solid ${cfg.color}44`,
    }}>
      <span style={{ fontSize: 10, color: cfg.color, animation: "os-breathe 2.4s infinite" }}>{cfg.dot}</span>
      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: cfg.color, letterSpacing: ".12em", fontWeight: 700 }}>
        {cfg.label}
      </span>
    </div>
  );
}
