"use client";

import { useState, useEffect } from "react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { useAgentChat } from "@/hooks/useAgentChat";
import ChatZone from "@/components/os/ChatZone";
import AppPreview from "@/components/os/AppPreview";

export default function OSPage() {
  const [activeAgent, setActiveAgent] = useState<AgentKey>("ceo");
  const [splitOpen, setSplitOpen] = useState(false);
  const [lastNavigate, setLastNavigate] = useState<string | undefined>();
  const [lastHighlight, setLastHighlight] = useState<string | undefined>();

  // Read active agent from layout window global
  useEffect(() => {
    if (typeof window !== "undefined" && window.__osActiveAgent) {
      setActiveAgent(window.__osActiveAgent);
    }
  }, []);

  const { messages, status, lastActive, sendMessage, resolveBeslissing, clearHistory } = useAgentChat(activeAgent);

  // Update layout sidebar agent info
  useEffect(() => {
    if (typeof window !== "undefined" && window.__osSetAgentInfo) {
      window.__osSetAgentInfo(activeAgent, { status, lastActive });
    }
  }, [activeAgent, status, lastActive]);

  // Track navigate/highlight from latest agent message
  useEffect(() => {
    const last = messages.findLast(m => m.role === "agent");
    if (last?.navigate) setLastNavigate(last.navigate);
    if (last?.highlight) setLastHighlight(last.highlight);
  }, [messages]);

  // Override active agent from layout global
  useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = setInterval(() => {
      if (window.__osActiveAgent && window.__osActiveAgent !== activeAgent) {
        setActiveAgent(window.__osActiveAgent);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [activeAgent]);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <ChatZone
        agentKey={activeAgent}
        status={status}
        messages={messages}
        onSend={sendMessage}
        onResolveBeslissing={resolveBeslissing}
        onClear={clearHistory}
        onToggleSplit={() => setSplitOpen(s => !s)}
        splitOpen={splitOpen}
        lastNavigate={lastNavigate}
      />
      {splitOpen && (
        <AppPreview
          onClose={() => setSplitOpen(false)}
          navigateTo={lastNavigate}
          highlightSelector={lastHighlight}
        />
      )}
    </div>
  );
}
