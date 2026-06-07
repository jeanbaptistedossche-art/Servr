"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import type { AgentKey } from "@/lib/os/agentConfig";
import Sidebar from "@/components/os/Sidebar";
import ActivityBar from "@/components/os/ActivityBar";
import { useBacklog } from "@/hooks/useBacklog";
import { OSContextProvider, useOSContext } from "@/contexts/OSContext";
import { OSEventBusProvider } from "@/contexts/OSEventBusContext";

// Inner layout reads from context
function OSLayoutInner({ children }: { children: React.ReactNode }) {
  const { activeAgent, setActiveAgent, agentInfos } = useOSContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: backlog } = useBacklog(60000);
  const router = useRouter();
  const openCount = backlog.sprintQueue.length + backlog.inProgress.length;

  function handleSelectAgent(key: AgentKey) {
    setActiveAgent(key);
    setMobileOpen(false);
    router.push("/os"); // altijd naar de chat pagina navigeren
  }

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "var(--os-bg)",
        display: "flex", flexDirection: "column",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Desktop sidebar */}
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

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Mobile topbar */}
            <div
              id="os-mobile-bar"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderBottom: "1px solid #1a1a1a",
                background: "#111111",
              }}
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

export default function OSLayout({ children }: { children: React.ReactNode }) {
  return (
    <OSContextProvider>
      <OSEventBusProvider>
        <OSLayoutInner>{children}</OSLayoutInner>
      </OSEventBusProvider>
    </OSContextProvider>
  );
}
