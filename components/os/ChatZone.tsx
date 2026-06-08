"use client";

import { useRef, useEffect, useState } from "react";
import { Columns2, Trash2, Send } from "lucide-react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENTS } from "@/lib/os/agentConfig";
import type { Message } from "@/hooks/useAgentChat";
import AgentAvatar from "./AgentAvatar";
import StatusBadge from "./StatusBadge";
import MessageBubble from "./MessageBubble";
import QuickCommands from "./QuickCommands";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { AgentStatus } from "@/hooks/useAgentChat";

type Props = {
  agentKey: AgentKey;
  status: AgentStatus;
  messages: Message[];
  onSend: (cmd: string) => void;
  onResolveBeslissing: (msgId: string, choice: string) => void;
  onClear: () => void;
  onToggleSplit: () => void;
  splitOpen: boolean;
  lastNavigate?: string;
};

export default function ChatZone({
  agentKey, status, messages, onSend,
  onResolveBeslissing, onClear, onToggleSplit, splitOpen,
}: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const agent = AGENTS[agentKey];

  // Voice: één handler — commando wordt direct verstuurd
  const { micState, rawTranscript, isSupported, toggle } = useVoiceInput((cmd) => {
    if (status !== "active") onSend(cmd);
  });

  const isListening = micState === "listening" || micState === "awake";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const cmd = input.trim();
    if (!cmd || status === "active") return;
    setInput("");
    onSend(cmd);
  }

  function handleQuick(cmd: string) {
    setInput(cmd);
    inputRef.current?.focus();
  }

  const micLabel = () => {
    if (micState === "permission-denied") return "❌";
    if (micState === "awake") return "⚡";
    if (micState === "listening") return "⏹️";
    return "🎙️";
  };

  const micColor = () => {
    if (micState === "permission-denied") return { bg: "#1a0808", color: "#ef4444" };
    if (micState === "awake") return { bg: "#1a1500", color: "#eab308" };
    if (micState === "listening") return { bg: "#0d1a0d", color: "#22c55e" };
    return { bg: "#1a1a1a", color: "#6b7280" };
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Header */}
      <div style={{
        height: 48, padding: "0 16px",
        display: "flex", alignItems: "center", gap: 10,
        background: "#111111", borderBottom: "1px solid #1a1a1a", flexShrink: 0,
      }}>
        <AgentAvatar agentKey={agentKey} size={28} pulse={status === "active"} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1 }}>
            {agent.emoji} {agent.name}
          </p>
          <p style={{ fontSize: 10, color: "#4b5563", margin: 0 }}>{agent.description}</p>
        </div>
        <StatusBadge status={status} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={onClear} title="Clear chat" style={{
            background: "none", border: "1px solid #1f2937", borderRadius: 6,
            cursor: "pointer", color: "#4b5563", padding: "4px 8px",
            display: "flex", alignItems: "center",
          }}>
            <Trash2 size={13} />
          </button>
          <button onClick={onToggleSplit} title="Split view" style={{
            background: splitOpen ? "#1e3a5f" : "none",
            border: `1px solid ${splitOpen ? "#3b82f6" : "#1f2937"}`,
            borderRadius: 6, cursor: "pointer",
            color: splitOpen ? "#3b82f6" : "#4b5563",
            padding: "4px 8px", display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 500,
          }}>
            <Columns2 size={13} /> Split
          </button>
        </div>
      </div>

      {/* Luisterbalk */}
      {isListening && (
        <div style={{
          background: micState === "awake" ? "#1a1500" : "#0d1a0d",
          borderBottom: `1px solid ${micState === "awake" ? "#854d0e" : "#14532d"}`,
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                width: 3, borderRadius: 2,
                background: micState === "awake" ? "#eab308" : "#22c55e",
                height: `${Math.sin(i * 0.9) * 8 + 12}px`,
                animation: `waveBar 0.5s ease-in-out ${i * 0.06}s infinite alternate`,
              }} />
            ))}
          </div>
          <span style={{
            color: micState === "awake" ? "#eab308" : "#22c55e",
            fontSize: 12, fontWeight: 600,
          }}>
            {micState === "awake" ? "⚡ Zeg je vraag..." : "🎙️ Luistert naar \"Hey Servr...\""}
          </span>
          {rawTranscript && (
            <span style={{ color: "#9ca3af", fontSize: 11, fontStyle: "italic" }}>"{rawTranscript}"</span>
          )}
          <style>{`@keyframes waveBar { from { transform: scaleY(0.4); } to { transform: scaleY(1.4); } }`}</style>
        </div>
      )}

      {/* Permissie geweigerd melding */}
      {micState === "permission-denied" && (
        <div style={{
          background: "#1a0808", borderBottom: "1px solid #7f1d1d",
          padding: "8px 16px", fontSize: 11, color: "#fca5a5", flexShrink: 0,
        }}>
          ❌ Microfoon geblokkeerd. Klik op het slotje 🔒 in de adresbalk → Microfoon → Toestaan → herlaad de pagina.
        </div>
      )}

      {/* Messages */}
      <div className="os-scroll" style={{
        flex: 1, overflowY: "auto", padding: "24px 20px",
        background: "#080808", display: "flex", flexDirection: "column",
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#374151", textAlign: "center",
          }}>
            <span style={{ fontSize: 40, marginBottom: 12 }}>{agent.emoji}</span>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 4px" }}>Chat met {agent.name}</p>
            <p style={{ fontSize: 12, color: "#374151", margin: "0 0 16px" }}>{agent.placeholder}</p>
            {isSupported && micState === "off" && (
              <div style={{
                background: "#111", border: "1px solid #1f2937", borderRadius: 8,
                padding: "10px 16px", fontSize: 11, color: "#6b7280",
              }}>
                🎙️ Klik op de microfoon en zeg <strong style={{ color: "#9ca3af" }}>"Hey Servr, ..."</strong>
              </div>
            )}
          </div>
        )}
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} onResolveBeslissing={onResolveBeslissing} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        background: "#0d0d0d", borderTop: "1px solid #1a1a1a",
        padding: "12px 16px", flexShrink: 0,
      }}>
        <QuickCommands onSelect={handleQuick} disabled={status === "active"} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            background: "#1a1a1a", borderRadius: 10,
            border: `1px solid ${isListening ? "#22c55e44" : "#1f2937"}`,
            padding: "0 12px", transition: "border-color 0.2s",
          }}>
            <input
              ref={inputRef}
              value={rawTranscript || input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={agent.placeholder}
              disabled={status === "active"}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: 13, color: "#f9fafb", padding: "10px 0",
                fontFamily: "system-ui, sans-serif",
              }}
            />
          </div>

          {/* Mic knop */}
          {isSupported && (
            <button
              onClick={toggle}
              title={
                micState === "off" ? 'Klik om te luisteren — zeg dan "Hey Servr, ..."'
                : micState === "permission-denied" ? "Microfoon geblokkeerd — zie melding hierboven"
                : "Stop luisteren"
              }
              style={{
                padding: "0 16px", borderRadius: 10, border: "none",
                background: micColor().bg,
                color: micColor().color,
                cursor: "pointer", fontSize: 16,
                transition: "all 0.15s",
              }}
            >
              {micLabel()}
            </button>
          )}

          {/* Verzenden */}
          <button
            onClick={send}
            disabled={(!input.trim() && !rawTranscript) || status === "active"}
            style={{
              padding: "0 16px", borderRadius: 10, border: "none",
              background: ((!input.trim() && !rawTranscript) || status === "active") ? "#1a1a1a" : "#1d4ed8",
              color: ((!input.trim() && !rawTranscript) || status === "active") ? "#374151" : "#fff",
              cursor: ((!input.trim() && !rawTranscript) || status === "active") ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center",
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
