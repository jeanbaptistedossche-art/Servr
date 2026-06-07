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
  onResolveBeslissing, onClear, onToggleSplit, splitOpen, lastNavigate,
}: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const agent = AGENTS[agentKey];

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

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      overflow: "hidden", minWidth: 0,
    }}>
      {/* Chat header */}
      <div style={{
        height: 48, padding: "0 16px",
        display: "flex", alignItems: "center", gap: 10,
        background: "#111111", borderBottom: "1px solid #1a1a1a",
        flexShrink: 0,
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
          <button
            onClick={onClear}
            title="Clear chat"
            style={{
              background: "none", border: "1px solid #1f2937",
              borderRadius: 6, cursor: "pointer", color: "#4b5563",
              padding: "4px 8px", display: "flex", alignItems: "center",
              transition: "all 0.15s",
            }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onToggleSplit}
            title="Split view"
            style={{
              background: splitOpen ? "#1e3a5f" : "none",
              border: `1px solid ${splitOpen ? "#3b82f6" : "#1f2937"}`,
              borderRadius: 6, cursor: "pointer",
              color: splitOpen ? "#3b82f6" : "#4b5563",
              padding: "4px 8px", display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 500,
              transition: "all 0.15s",
            }}
          >
            <Columns2 size={13} />
            Split
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="os-scroll"
        style={{
          flex: 1, overflowY: "auto",
          padding: "24px 20px",
          background: "#080808",
          display: "flex", flexDirection: "column",
        }}
      >
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#374151", textAlign: "center",
          }}>
            <span style={{ fontSize: 40, marginBottom: 12 }}>{agent.emoji}</span>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 6px" }}>
              Chat with {agent.name}
            </p>
            <p style={{ fontSize: 12, color: "#374151" }}>{agent.placeholder}</p>
          </div>
        )}
        {messages.map(m => (
          <MessageBubble
            key={m.id}
            message={m}
            onResolveBeslissing={onResolveBeslissing}
          />
        ))}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div style={{
        background: "#0d0d0d", borderTop: "1px solid #1a1a1a",
        padding: "12px 16px", flexShrink: 0,
      }}>
        <QuickCommands onSelect={handleQuick} disabled={status === "active"} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            background: "#1a1a1a", borderRadius: 10,
            border: "1px solid #1f2937",
            padding: "0 12px",
          }}>
            <input
              ref={inputRef}
              value={input}
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
          <button
            onClick={send}
            disabled={!input.trim() || status === "active"}
            style={{
              padding: "0 16px", borderRadius: 10, border: "none",
              background: (!input.trim() || status === "active") ? "#1a1a1a" : "#1d4ed8",
              color: (!input.trim() || status === "active") ? "#374151" : "#fff",
              cursor: (!input.trim() || status === "active") ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center",
              transition: "all 0.15s",
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
