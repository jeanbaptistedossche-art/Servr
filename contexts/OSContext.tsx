"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AgentKey } from "@/lib/os/agentConfig";
import type { AgentStatus } from "@/hooks/useAgentChat";

export type AgentInfo = { status: AgentStatus; lastActive: string };

type OSContextValue = {
  activeAgent: AgentKey;
  setActiveAgent: (k: AgentKey) => void;
  agentInfos: Record<AgentKey, AgentInfo>;
  updateAgentInfo: (k: AgentKey, info: AgentInfo) => void;
};

const OSContext = createContext<OSContextValue | null>(null);

const DEFAULT_INFOS = (): Record<AgentKey, AgentInfo> => ({
  ceo:       { status: "idle", lastActive: "—" },
  cto:       { status: "idle", lastActive: "—" },
  scout:     { status: "idle", lastActive: "—" },
  validator: { status: "idle", lastActive: "—" },
  cfo:       { status: "idle", lastActive: "—" },
  ux:        { status: "idle", lastActive: "—" },
  growth:    { status: "idle", lastActive: "—" },
  legal:     { status: "idle", lastActive: "—" },
  security:  { status: "idle", lastActive: "—" },
  ops:       { status: "idle", lastActive: "—" },
  dna:       { status: "idle", lastActive: "—" },
  scenario:  { status: "idle", lastActive: "—" },
  launch:    { status: "idle", lastActive: "—" },
});

export function OSContextProvider({ children }: { children: ReactNode }) {
  const [activeAgent, setActiveAgent] = useState<AgentKey>("ceo");
  const [agentInfos, setAgentInfos] = useState<Record<AgentKey, AgentInfo>>(DEFAULT_INFOS());

  const updateAgentInfo = useCallback((k: AgentKey, info: AgentInfo) => {
    setAgentInfos(prev => ({ ...prev, [k]: info }));
  }, []);

  return (
    <OSContext.Provider value={{ activeAgent, setActiveAgent, agentInfos, updateAgentInfo }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOSContext() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOSContext must be used inside OSContextProvider");
  return ctx;
}
