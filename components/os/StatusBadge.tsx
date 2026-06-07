import type { AgentStatus } from "@/hooks/useAgentChat";

const CONFIG: Record<AgentStatus, { bg: string; color: string; label: string }> = {
  idle:   { bg: "#1f2937", color: "#6b7280", label: "IDLE" },
  active: { bg: "#064e3b", color: "#10b981", label: "ACTIVE" },
  done:   { bg: "#1e3a5f", color: "#3b82f6", label: "DONE" },
};

export default function StatusBadge({ status }: { status: AgentStatus }) {
  const c = CONFIG[status];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
      padding: "2px 6px", borderRadius: 4,
      background: c.bg, color: c.color,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {status === "active" && (
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: "#10b981", display: "inline-block",
          animation: "os-pulse 1.5s infinite",
        }} />
      )}
      {c.label}
    </span>
  );
}
