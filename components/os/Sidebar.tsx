"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, ListChecks, FileText, BarChart2 } from "lucide-react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENTS, AGENT_KEYS } from "@/lib/os/agentConfig";
import type { AgentStatus } from "@/hooks/useAgentChat";
import AgentAvatar from "./AgentAvatar";
import StatusBadge from "./StatusBadge";

type AgentInfo = {
  status: AgentStatus;
  lastActive: string;
};

type Props = {
  activeAgent: AgentKey;
  agentInfos: Record<AgentKey, AgentInfo>;
  onSelectAgent: (key: AgentKey) => void;
  openTaskCount: number;
  onClose?: () => void;
};

const NAV = [
  { href: "/os/backlog", icon: ListChecks, label: "Backlog" },
  { href: "/os/state",   icon: FileText,   label: "State" },
  { href: "/os/market",  icon: BarChart2,  label: "Market" },
];

export default function Sidebar({ activeAgent, agentInfos, onSelectAgent, openTaskCount, onClose }: Props) {
  const pathname = usePathname();
  const today = new Date().toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });

  return (
    <aside style={{
      width: 200, height: "100%",
      background: "#0d0d0d",
      borderRight: "1px solid #1a1a1a",
      display: "flex", flexDirection: "column",
      flexShrink: 0, overflowY: "auto",
    }}
      className="os-scroll"
    >
      {/* Logo */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Terminal size={15} style={{ color: "#3b82f6" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Servr OS</span>
          <span style={{
            marginLeft: "auto", width: 7, height: 7, borderRadius: "50%",
            background: "#10b981", boxShadow: "0 0 5px #10b981",
            animation: "os-pulse 2s infinite", flexShrink: 0,
          }} />
        </div>
        <p style={{ fontSize: 10, color: "#4b5563", margin: 0 }}>{today} · North star: WAT</p>
      </div>

      {/* Agents */}
      <div style={{ padding: "10px 8px 4px" }}>
        <p style={{
          fontSize: 9, fontWeight: 700, color: "#374151",
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "0 6px 6px", margin: 0,
        }}>
          Agents
        </p>
        {AGENT_KEYS.map(key => {
          const a = AGENTS[key];
          const info = agentInfos[key];
          const isActive = key === activeAgent && pathname === "/os";
          return (
            <button
              key={key}
              onClick={() => { onSelectAgent(key); onClose?.(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "7px 8px", borderRadius: 7, marginBottom: 2,
                background: isActive ? `${a.color}18` : "transparent",
                border: `1px solid ${isActive ? a.color + "44" : "transparent"}`,
                cursor: "pointer", textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <AgentAvatar agentKey={key} size={26} pulse={info.status === "active"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#fff" : "#d1d5db", margin: 0 }}>
                  {a.name}
                </p>
                <p style={{ fontSize: 9, color: "#4b5563", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {info.lastActive !== "—" ? info.lastActive : a.description}
                </p>
              </div>
              <StatusBadge status={info.status} />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#1a1a1a", margin: "8px 14px" }} />

      {/* Nav links */}
      <nav style={{ padding: "4px 8px" }}>
        <p style={{
          fontSize: 9, fontWeight: 700, color: "#374151",
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "0 6px 6px", margin: 0,
        }}>
          Pages
        </p>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} onClick={onClose} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 8px", borderRadius: 7, marginBottom: 2,
              background: active ? "#1e3a8a22" : "transparent",
              textDecoration: "none", transition: "background 0.15s",
            }}>
              <Icon size={13} style={{ color: active ? "#3b82f6" : "#4b5563" }} />
              <span style={{ fontSize: 12, color: active ? "#93c5fd" : "#6b7280", fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom metrics */}
      <div style={{ marginTop: "auto", padding: "10px 14px", borderTop: "1px solid #1a1a1a" }}>
        <p style={{ fontSize: 10, color: "#374151", margin: "0 0 2px" }}>
          Sprint: <span style={{ color: "#6b7280" }}>{openTaskCount} open</span>
        </p>
        <p style={{ fontSize: 10, color: "#374151", margin: 0 }}>
          WAT: <span style={{ color: "#3b82f6" }}>—</span>
        </p>
      </div>
    </aside>
  );
}
