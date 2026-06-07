"use client";

import { useState, useCallback } from "react";
import { Menu } from "lucide-react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENT_KEYS } from "@/lib/os/agentConfig";
import type { AgentStatus } from "@/hooks/useAgentChat";
import Sidebar from "@/components/os/Sidebar";
import ActivityBar from "@/components/os/ActivityBar";
import { useBacklog } from "@/hooks/useBacklog";

export type AgentInfo = { status: AgentStatus; lastActive: string };

// Expose agent state to child pages via a simple context-like pattern using window
declare global {
  interface Window {
    __osActiveAgent: AgentKey;
    __osSetActiveAgent: (k: AgentKey) => void;
    __osSetAgentInfo: (k: AgentKey, info: AgentInfo) => void;
  }
}

const DEFAULT_INFOS = (): Record<AgentKey, AgentInfo> =>
  Object.fromEntries(AGENT_KEYS.map(k => [k, { status: "idle" as AgentStatus, lastActive: "—" }])) as Record<AgentKey, AgentInfo>;

export default function OSLayout({ children }: { children: React.ReactNode }) {
  const [activeAgent, setActiveAgent] = useState<AgentKey>("ceo");
  const [agentInfos, setAgentInfos] = useState<Record<AgentKey, AgentInfo>>(DEFAULT_INFOS());
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: backlog } = useBacklog(60000);

  // Expose to child pages
  if (typeof window !== "undefined") {
    window.__osActiveAgent = activeAgent;
    window.__osSetActiveAgent = setActiveAgent;
    window.__osSetAgentInfo = (k, info) =>
      setAgentInfos(prev => ({ ...prev, [k]: info }));
  }

  const handleSelectAgent = useCallback((key: AgentKey) => {
    setActiveAgent(key);
    // navigate to /os chat page
    window.location.href = "/os";
  }, []);

  const openCount = backlog.sprintQueue.length + backlog.inProgress.length;

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "var(--os-bg)",
        display: "flex", flexDirection: "column",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        {/* Main row: sidebar + content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Desktop sidebar */}
          <div style={{ display: "none" }} className="md-sidebar">
            <Sidebar
              activeAgent={activeAgent}
              agentInfos={agentInfos}
              onSelectAgent={handleSelectAgent}
              openTaskCount={openCount}
            />
          </div>

          {/* Always-visible sidebar on md+ — using inline style media workaround */}
          <div id="os-sidebar-desktop" style={{ flexShrink: 0 }}>
            <Sidebar
              activeAgent={activeAgent}
              agentInfos={agentInfos}
              onSelectAgent={handleSelectAgent}
              openTaskCount={openCount}
            />
          </div>

          {/* Mobile sidebar overlay */}
          {mobileOpen && (
            <div
              style={{ position: "fixed", inset: 0, zIndex: 10001, display: "flex" }}
              onClick={() => setMobileOpen(false)}
            >
              <div style={{ width: 200, height: "100%", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <Sidebar
                  activeAgent={activeAgent}
                  agentInfos={agentInfos}
                  onSelectAgent={handleSelectAgent}
                  openTaskCount={openCount}
                  onClose={() => setMobileOpen(false)}
                />
              </div>
              <div style={{ flex: 1, background: "rgba(0,0,0,0.6)" }} />
            </div>
          )}

          {/* Main content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Mobile topbar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderBottom: "1px solid #1a1a1a",
              background: "#111111",
            }}
              id="os-mobile-bar"
            >
              <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                <Menu size={18} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Servr OS</span>
              <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "os-pulse 2s infinite" }} />
            </div>

            <div style={{ flex: 1, overflow: "hidden" }}>
              {children}
            </div>
          </div>
        </div>

        {/* Activity bar */}
        <ActivityBar />
      </div>

      <style>{`
        #os-sidebar-desktop { display: flex; }
        #os-mobile-bar { display: none; }
        @media (max-width: 768px) {
          #os-sidebar-desktop { display: none !important; }
          #os-mobile-bar { display: flex !important; }
        }
      `}</style>
    </>
  );
}
