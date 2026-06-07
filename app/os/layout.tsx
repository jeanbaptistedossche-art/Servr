"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal, LayoutDashboard, ListChecks, BarChart2,
  FileText, Menu, X, Circle,
} from "lucide-react";

type AgentStatus = "idle" | "active" | "done";

type Agent = {
  emoji: string;
  name: string;
  status: AgentStatus;
  lastRun: string;
};

const DEFAULT_AGENTS: Agent[] = [
  { emoji: "🧠", name: "CEO",       status: "idle", lastRun: "—" },
  { emoji: "⚙️", name: "CTO",       status: "idle", lastRun: "—" },
  { emoji: "🔍", name: "Scout",     status: "idle", lastRun: "—" },
  { emoji: "✅", name: "Validator", status: "idle", lastRun: "—" },
];

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle:   "#6b7280",
  active: "#f59e0b",
  done:   "#22c55e",
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle:   "IDLE",
  active: "ACTIVE",
  done:   "DONE",
};

const NAV_LINKS = [
  { href: "/os",         icon: LayoutDashboard, label: "Command Center" },
  { href: "/os/backlog", icon: ListChecks,      label: "Backlog" },
  { href: "/os/state",   icon: FileText,        label: "State" },
  { href: "/os/market",  icon: BarChart2,       label: "Market" },
];

// Expose agent state globally so the main page can update it
declare global {
  interface Window { __osSetAgents?: (agents: Agent[]) => void; }
}

export default function OSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);

  // Expose setter so API response can update agent status
  useEffect(() => {
    window.__osSetAgents = setAgents;
    return () => { delete window.__osSetAgents; };
  }, []);

  const Sidebar = () => (
    <aside style={{
      width: 240, minHeight: "100vh",
      background: "#0d0d0d",
      borderRight: "1px solid #1f1f1f",
      display: "flex", flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1f1f1f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Terminal size={18} style={{ color: "#2563eb" }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Servr OS
          </span>
          <div style={{
            marginLeft: "auto", width: 7, height: 7,
            borderRadius: "50%", background: "#22c55e",
            boxShadow: "0 0 6px #22c55e",
            animation: "pulse 2s infinite",
          }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px" }}>
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8, marginBottom: 2,
              background: active ? "#1e3a8a22" : "transparent",
              textDecoration: "none",
              transition: "background 0.15s",
            }}>
              <Icon size={15} style={{ color: active ? "#2563eb" : "#6b7280" }} />
              <span style={{
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? "#93c5fd" : "#9ca3af",
              }}>
                {label}
              </span>
              {active && (
                <div style={{
                  marginLeft: "auto", width: 5, height: 5,
                  borderRadius: "50%", background: "#2563eb",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Agents */}
      <div style={{ padding: "0 10px", marginTop: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#4b5563", letterSpacing: "0.08em", padding: "0 10px 8px", textTransform: "uppercase" }}>
          Agents
        </p>
        {agents.map(a => (
          <div key={a.name} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 8, marginBottom: 2,
          }}>
            <span style={{ fontSize: 15 }}>{a.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#d1d5db", margin: 0 }}>{a.name}</p>
              <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>{a.lastRun}</p>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              color: STATUS_COLOR[a.status],
              border: `1px solid ${STATUS_COLOR[a.status]}33`,
              background: `${STATUS_COLOR[a.status]}11`,
              padding: "2px 5px", borderRadius: 4,
            }}>
              {STATUS_LABEL[a.status]}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />
      <div style={{ padding: "12px 20px", borderTop: "1px solid #1f1f1f" }}>
        <p style={{ fontSize: 11, color: "#4b5563", margin: 0 }}>
          North star: <span style={{ color: "#2563eb" }}>WAT</span>
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Full-screen overlay over root layout */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#0a0a0a", display: "flex",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        {/* Desktop sidebar */}
        <div className="hidden md:flex" style={{ flexShrink: 0 }}>
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex" }}>
            <div
              style={{ flex: 1, background: "rgba(0,0,0,0.7)" }}
              onClick={() => setSidebarOpen(false)}
            />
            <div style={{ width: 240, position: "absolute", left: 0, top: 0, bottom: 0 }}>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Mobile topbar */}
          <div className="flex md:hidden" style={{
            padding: "12px 16px",
            borderBottom: "1px solid #1f1f1f",
            alignItems: "center", gap: 12,
          }}>
            <button onClick={() => setSidebarOpen(true)} style={{
              background: "none", border: "none", cursor: "pointer", color: "#9ca3af",
              display: "flex", alignItems: "center",
            }}>
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Servr OS</span>
            <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes dots { 0%{content:'.'} 33%{content:'..'} 66%{content:'...'} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
    </>
  );
}
