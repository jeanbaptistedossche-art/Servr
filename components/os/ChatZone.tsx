"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Columns2, Trash2, Send } from "lucide-react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENTS } from "@/lib/os/agentConfig";
import type { Message } from "@/hooks/useAgentChat";
import AgentAvatar from "./AgentAvatar";
import StatusBadge from "./StatusBadge";
import MessageBubble from "./MessageBubble";
import QuickCommands from "./QuickCommands";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
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
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false); // altijd uit tenzij gebruiker aanzet
  const [voiceLang, setVoiceLang] = useState<"nl-BE" | "en-US">("nl-BE");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const agent = AGENTS[agentKey];
  const lastSpokenId = useRef<string | null>(null);

  const { speak } = useVoiceOutput();

  const handleTranscript = useCallback((text: string) => {
    setInput(text);
    // Auto-send after brief pause
    setTimeout(() => {
      if (text.trim() && status !== "active") {
        setInput("");
        onSend(text.trim());
      }
    }, 800);
  }, [onSend, status]);

  const { isListening, isSupported, interimText, toggleListening } = useVoiceInput(handleTranscript, voiceLang);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice output: speak last agent message when done streaming
  useEffect(() => {
    if (!voiceOutputEnabled) return;
    const last = [...messages].reverse().find(m => m.role === "agent" && !m.streaming && m.content);
    if (!last || last.id === lastSpokenId.current) return;
    lastSpokenId.current = last.id;
    speak(last.content, agentKey);
  }, [messages, voiceOutputEnabled, agentKey, speak]);

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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* Chat header */}
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

        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
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
              fontSize: 11, fontWeight: 500, transition: "all 0.15s",
            }}
          >
            <Columns2 size={13} />
            Split
          </button>
        </div>
      </div>

      {/* Listening banner */}
      {isListening && (
        <div style={{
          background: "#0d1a0d", borderBottom: "1px solid #14532d",
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                width: 3, borderRadius: 2, background: "#22c55e",
                height: `${Math.sin(i * 0.9) * 8 + 12}px`,
                animation: `waveBar 0.5s ease-in-out ${i * 0.06}s infinite alternate`,
              }} />
            ))}
          </div>
          <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>🎙️ Aan het luisteren...</span>
          {interimText && (
            <span style={{ color: "#9ca3af", fontSize: 11, fontStyle: "italic" }}>"{interimText}"</span>
          )}
          {/* Lang toggle */}
          <button
            onClick={() => setVoiceLang(l => l === "nl-BE" ? "en-US" : "nl-BE")}
            style={{
              marginLeft: "auto", background: "none", border: "1px solid #14532d",
              borderRadius: 4, padding: "2px 8px", color: "#22c55e", fontSize: 11,
              cursor: "pointer",
            }}
          >
            {voiceLang === "nl-BE" ? "🇧🇪 NL" : "🇬🇧 EN"}
          </button>
          <style>{`
            @keyframes waveBar {
              from { transform: scaleY(0.4); }
              to { transform: scaleY(1.4); }
            }
          `}</style>
        </div>
      )}

      {/* Messages */}
      <div
        className="os-scroll"
        style={{
          flex: 1, overflowY: "auto", padding: "24px 20px",
          background: "#080808", display: "flex", flexDirection: "column",
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
              Chat met {agent.name}
            </p>
            <p style={{ fontSize: 12, color: "#374151" }}>{agent.placeholder}</p>
            {isSupported && (
              <p style={{ fontSize: 11, color: "#1f2937", marginTop: 12 }}>
                🎙️ Klik op microfoon om in te spreken · 🎙️ "Hey Servr" voor hands-free
              </p>
            )}
          </div>
        )}
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} onResolveBeslissing={onResolveBeslissing} />
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
            border: `1px solid ${isListening ? "#22c55e" : "#1f2937"}`,
            padding: "0 12px", transition: "border-color 0.2s",
          }}>
            <input
              ref={inputRef}
              value={interimText || input}
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

          {/* Mic button */}
          {isSupported && (
            <button
              onClick={toggleListening}
              title={isListening ? "Stop luisteren" : "Spreek je bericht in"}
              style={{
                padding: "0 14px", borderRadius: 10, border: "none",
                background: isListening ? "#14532d" : "#1a1a1a",
                color: isListening ? "#22c55e" : "#6b7280",
                cursor: "pointer", fontSize: 16,
                animation: isListening ? "pulse 1.5s ease-in-out infinite" : "none",
                transition: "all 0.15s",
              }}
            >
              {isListening ? "⏹️" : "🎙️"}
            </button>
          )}

          {/* Voice output — klein, verstopt, alleen voor wie het wil */}
          {isSupported && (
            <button
              onClick={() => setVoiceOutputEnabled(v => !v)}
              title={voiceOutputEnabled ? "Agent stopt met praten — klik om uit te zetten" : "Agent praat terug (optioneel)"}
              style={{
                padding: "0 10px", borderRadius: 10, border: "none",
                background: voiceOutputEnabled ? "#1a2a1a" : "#1a1a1a",
                color: voiceOutputEnabled ? "#22c55e" : "#374151",
                cursor: "pointer", fontSize: 13,
                transition: "all 0.15s",
              }}
            >
              {voiceOutputEnabled ? "🔊" : "🔇"}
            </button>
          )}

          {/* Send button */}
          <button
            onClick={send}
            disabled={(!input.trim() && !interimText) || status === "active"}
            style={{
              padding: "0 16px", borderRadius: 10, border: "none",
              background: ((!input.trim() && !interimText) || status === "active") ? "#1a1a1a" : "#1d4ed8",
              color: ((!input.trim() && !interimText) || status === "active") ? "#374151" : "#fff",
              cursor: ((!input.trim() && !interimText) || status === "active") ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", transition: "all 0.15s",
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
