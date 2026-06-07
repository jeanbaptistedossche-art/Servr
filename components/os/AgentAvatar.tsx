import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENTS } from "@/lib/os/agentConfig";

type Props = {
  agentKey: AgentKey;
  size?: number;
  pulse?: boolean;
};

export default function AgentAvatar({ agentKey, size = 28, pulse = false }: Props) {
  const a = AGENTS[agentKey];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: a.color + "33",
      border: `1.5px solid ${a.color}66`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5, flexShrink: 0,
      position: "relative",
    }}>
      {a.emoji}
      {pulse && (
        <span style={{
          position: "absolute", bottom: 0, right: 0,
          width: size * 0.28, height: size * 0.28,
          borderRadius: "50%", background: "#10b981",
          border: "1.5px solid #080808",
          animation: "os-pulse 2s infinite",
        }} />
      )}
    </div>
  );
}
