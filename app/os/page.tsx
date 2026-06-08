"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENT_KEYS } from "@/lib/os/agentConfig";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useOSContext } from "@/contexts/OSContext";
import { useOSEventBus } from "@/contexts/OSEventBusContext";
import { processIntent } from "@/lib/os/intentProcessor";
import ChatZone from "@/components/os/ChatZone";
import AppPreviewPanel from "@/components/os/AppPreviewPanel";
import AgentSwitchToast from "@/components/os/AgentSwitchToast";
import WakeWordIndicator from "@/components/os/WakeWordIndicator";
import { useWakeWord } from "@/hooks/useWakeWord";

function OSPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeAgent, setActiveAgent, updateAgentInfo } = useOSContext();
  const { emit } = useOSEventBus();
  const [splitOpen, setSplitOpen] = useState(false);
  const [toast, setToast] = useState<{ key: AgentKey; question?: string } | null>(null);
  const autoSentRef = useRef(false);

  const { getMessages, getStatus, getLastActive, sendMessage, resolveBeslissing, clearHistory } = useAgentChat();

  const { isAwake, isListeningForCommand, transcript, wakeWordMode, setWakeWordMode } = useWakeWord({
    enabled: true,
    onWakeWordDetected: () => {},
    onCommand: (command, targetAgent) => {
      const target = targetAgent ?? activeAgent;
      sendMessage(target, command, handleAgentSwitchRef.current);
    },
    onAgentSwitch: (agent) => {
      setActiveAgent(agent);
      router.push("/os");
    },
  });

  const messages  = getMessages(activeAgent);
  const status    = getStatus(activeAgent);
  const lastActive = getLastActive(activeAgent);

  // Sync agent status back to context (so sidebar shows live status)
  useEffect(() => {
    updateAgentInfo(activeAgent, { status, lastActive });
  }, [activeAgent, status, lastActive, updateAgentInfo]);

  // When agent emits navigate/highlight, forward to event bus → AppPreviewPanel
  useEffect(() => {
    const last = messages.findLast(m => m.role === "agent" && !m.streaming);
    if (!last) return;
    if (last.navigate) {
      emit("NAVIGATE", last.navigate);
      setSplitOpen(true); // auto-open preview on navigate
    }
    if (last.highlight) {
      emit("HIGHLIGHT", last.highlight);
      setSplitOpen(true);
    }
  }, [messages, emit]);

  // Agent handoff handler — called by useAgentChat after SWITCH_AGENT / ASK_AGENT tag
  // autoQuestion: als CEO [ASK_AGENT: scout | vraag] gebruikt, wordt die vraag automatisch gestuurd
  const handleAgentSwitch = useCallback((newAgent: AgentKey, autoQuestion?: string) => {
    setToast({ key: newAgent, question: autoQuestion });
    setTimeout(() => {
      setActiveAgent(newAgent);
      // ASK_AGENT flow: stuur de vraag automatisch door na de switch
      if (autoQuestion) {
        setTimeout(() => {
          sendMessage(newAgent, autoQuestion, handleAgentSwitchRef.current);
        }, 600);
      }
    }, 500);
  }, [setActiveAgent, sendMessage]); // eslint-disable-line

  // Ref zodat de callback zichzelf kan doorgeven zonder stale closure
  const handleAgentSwitchRef = useRef(handleAgentSwitch);
  useEffect(() => { handleAgentSwitchRef.current = handleAgentSwitch; }, [handleAgentSwitch]);

  // Process user message for intents before sending
  const handleSend = useCallback((cmd: string) => {
    // Check natural language intents
    const intents = processIntent(cmd);
    for (const intent of intents) {
      if (intent.type === "NAVIGATE") {
        emit("NAVIGATE", intent.payload);
        setSplitOpen(true);
      }
      if (intent.type === "SWITCH_AGENT") {
        setActiveAgent(intent.payload);
        sendMessage(intent.payload, cmd, handleAgentSwitchRef.current);
        return;
      }
      if (intent.type === "OPEN_PREVIEW") {
        setSplitOpen(true);
      }
    }
    sendMessage(activeAgent, cmd, handleAgentSwitchRef.current);
  }, [activeAgent, sendMessage, emit, setActiveAgent]);

  const handleResolveBeslissing = useCallback((msgId: string, choice: string) => {
    resolveBeslissing(activeAgent, msgId);
    sendMessage(activeAgent, choice, handleAgentSwitchRef.current);
  }, [activeAgent, resolveBeslissing, sendMessage]);

  // Auto-send from URL params (?agent=cto&cmd=Fix: ...)
  // Used by the Launch checklist "Fix met agent" buttons
  useEffect(() => {
    if (autoSentRef.current) return;
    const agentParam = searchParams.get("agent");
    const cmdParam   = searchParams.get("cmd");
    if (!agentParam || !cmdParam) return;

    const key = agentParam as AgentKey;
    if (!AGENT_KEYS.includes(key)) return;

    autoSentRef.current = true;

    // Switch agent first, then send after a tick so chat is ready
    setActiveAgent(key);
    const decoded = decodeURIComponent(cmdParam);
    setTimeout(() => {
      sendMessage(key, decoded, handleAgentSwitchRef.current);
      // Clean URL so refreshing doesn't re-send
      router.replace("/os");
    }, 300);
  }, [searchParams, setActiveAgent, sendMessage, handleAgentSwitch, router]);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <ChatZone
        agentKey={activeAgent}
        status={status}
        messages={messages}
        onSend={handleSend}
        onResolveBeslissing={handleResolveBeslissing}
        onClear={() => clearHistory(activeAgent)}
        onToggleSplit={() => setSplitOpen(s => !s)}
        splitOpen={splitOpen}
      />

      {splitOpen && (
        <AppPreviewPanel onClose={() => setSplitOpen(false)} />
      )}

      {/* Agent switch toast */}
      <AgentSwitchToast
        agentKey={toast?.key ?? null}
        autoQuestion={toast?.question}
        onDone={() => setToast(null)}
      />

      {/* Wake word indicator */}
      <WakeWordIndicator
        wakeWordMode={wakeWordMode}
        isAwake={isAwake}
        isListeningForCommand={isListeningForCommand}
        transcript={transcript}
        onToggle={() => setWakeWordMode(m => !m)}
      />
    </div>
  );
}

export default function OSPage() {
  return (
    <Suspense fallback={null}>
      <OSPageInner />
    </Suspense>
  );
}
