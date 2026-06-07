"use client";

import { useEffect, useState } from "react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENTS } from "@/lib/os/agentConfig";

type Props = {
  agentKey: AgentKey | null;
  autoQuestion?: string; // als ingevuld: meeting flow (vraag wordt automatisch verstuurd)
  onDone: () => void;
};

export default function AgentSwitchToast({ agentKey, autoQuestion, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!agentKey) return;
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 2400);
    return () => clearTimeout(t);
  }, [agentKey, onDone]);

  if (!agentKey) return null;
  const a = AGENTS[agentKey];
  const isMeeting = Boolean(autoQuestion);

  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 99999,
      background: "#111111", border: `1px solid ${a.color}44`,
      borderLeft: `3px solid ${a.color}`,
      borderRadius: 10, padding: "12px 16px",
      boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
      transform: visible ? "translateX(0)" : "translateX(120%)",
      opacity: visible ? 1 : 0,
      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      minWidth: 240, maxWidth: 320,
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 3px", display: "flex", alignItems: "center", gap: 6 }}>
        {isMeeting && <span style={{ fontSize: 10, background: a.color + "33", color: a.color, padding: "1px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.05em" }}>MEETING</span>}
        {a.emoji} {a.name} aan de beurt
      </p>
      {isMeeting && autoQuestion ? (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
          "{autoQuestion.slice(0, 80)}{autoQuestion.length > 80 ? "…" : ""}"
        </p>
      ) : (
        <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{a.description}</p>
      )}
    </div>
  );
}
