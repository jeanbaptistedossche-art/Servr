"use client";

import { useEffect, useState } from "react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENTS } from "@/lib/os/agentConfig";

type Props = {
  agentKey: AgentKey | null;
  onDone: () => void;
};

export default function AgentSwitchToast({ agentKey, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!agentKey) return;
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 2200);
    return () => clearTimeout(t);
  }, [agentKey, onDone]);

  if (!agentKey) return null;
  const a = AGENTS[agentKey];

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
      minWidth: 220,
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 2px" }}>
        {a.emoji} Switching to {a.name}
      </p>
      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{a.description}</p>
    </div>
  );
}
