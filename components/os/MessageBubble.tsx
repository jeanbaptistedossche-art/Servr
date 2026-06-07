"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import type { Message } from "@/hooks/useAgentChat";
import type { AgentKey } from "@/lib/os/agentConfig";
import { AGENTS } from "@/lib/os/agentConfig";
import AgentAvatar from "./AgentAvatar";
import DecisionCard from "./DecisionCard";

const CODE_FONT = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{
        position: "absolute", top: 8, right: 8,
        padding: "2px 8px", borderRadius: 4, border: "none",
        background: "#1f2937", color: copied ? "#10b981" : "#6b7280",
        fontSize: 10, cursor: "pointer", fontFamily: CODE_FONT,
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

type Props = {
  message: Message;
  onResolveBeslissing: (msgId: string, choice: string) => void;
};

export default function MessageBubble({ message, onResolveBeslissing }: Props) {
  const isUser = message.role === "user";
  const agentKey = message.agentKey as AgentKey | undefined;
  const agentConfig = agentKey ? AGENTS[agentKey] : undefined;
  const ts = new Date(message.timestamp).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

  if (isUser) {
    return (
      <div style={{
        display: "flex", justifyContent: "flex-end",
        marginBottom: 12, animation: "os-fadeup 0.15s ease-out",
      }}>
        <div style={{ maxWidth: "70%", position: "relative" }}>
          <div style={{
            background: "#1d4ed8", color: "#fff",
            borderRadius: "14px 14px 4px 14px",
            padding: "10px 14px", fontSize: 13, lineHeight: 1.6,
          }}>
            {message.content}
          </div>
          <p style={{ fontSize: 10, color: "#374151", textAlign: "right", margin: "3px 4px 0" }}>{ts}</p>
        </div>
      </div>
    );
  }

  // Agent message
  const isTyping = message.streaming && !message.content;

  return (
    <div style={{
      display: "flex", gap: 10,
      marginBottom: 16, animation: "os-fadeup 0.15s ease-out",
      alignItems: "flex-start",
    }}>
      {agentKey && <AgentAvatar agentKey={agentKey} size={28} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        {agentConfig && (
          <p style={{ fontSize: 11, color: agentConfig.color, fontWeight: 600, margin: "0 0 4px" }}>
            {agentConfig.emoji} {agentConfig.name}
          </p>
        )}

        <div style={{
          background: "#111827",
          borderLeft: agentConfig ? `3px solid ${agentConfig.color}` : "3px solid #374151",
          borderRadius: "4px 14px 14px 14px",
          padding: "12px 16px",
          fontSize: 13, lineHeight: 1.7, color: "#f3f4f6",
        }}>
          {isTyping ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
              {[0, 1, 2].map(i => (
                <span key={i} className={`os-dot${i + 1}`} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: agentConfig?.color ?? "#6b7280",
                  display: "inline-block",
                }} />
              ))}
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p style={{ margin: "0 0 8px", color: "#f3f4f6" }}>{children}</p>,
                h1: ({ children }) => <h1 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "12px 0 6px" }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb", margin: "10px 0 5px" }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, color: "#d1d5db", margin: "8px 0 4px" }}>{children}</h3>,
                ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: "4px 0 8px" }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: 18, margin: "4px 0 8px" }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: 4, color: "#e5e7eb" }}>{children}</li>,
                strong: ({ children }) => <strong style={{ color: "#fff", fontWeight: 600 }}>{children}</strong>,
                em: ({ children }) => <em style={{ color: "#9ca3af" }}>{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote style={{ borderLeft: "2px solid #3b82f6", paddingLeft: 12, margin: "8px 0", color: "#9ca3af" }}>
                    {children}
                  </blockquote>
                ),
                code: ({ className, children, ...props }) => {
                  const isBlock = className?.includes("language-");
                  const text = String(children).replace(/\n$/, "");
                  if (isBlock) {
                    return (
                      <div style={{ position: "relative", margin: "10px 0" }}>
                        <pre style={{
                          background: "#0d1117", borderRadius: 8,
                          padding: "14px 16px", overflowX: "auto",
                          fontFamily: CODE_FONT, fontSize: 12, lineHeight: 1.6,
                          color: "#e6edf3", margin: 0,
                          border: "1px solid #30363d",
                        }}>
                          <code>{text}</code>
                        </pre>
                        <CopyButton text={text} />
                      </div>
                    );
                  }
                  return (
                    <code style={{
                      background: "#1f2937", padding: "1px 5px",
                      borderRadius: 4, fontFamily: CODE_FONT,
                      fontSize: 12, color: "#93c5fd",
                    }} {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({ children }) => (
                  <div style={{ overflowX: "auto", margin: "8px 0" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th style={{ padding: "6px 12px", background: "#1f2937", color: "#9ca3af", fontWeight: 600, textAlign: "left", borderBottom: "1px solid #374151" }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{ padding: "6px 12px", color: "#d1d5db", borderBottom: "1px solid #1f2937" }}>
                    {children}
                  </td>
                ),
                hr: () => <hr style={{ border: "none", borderTop: "1px solid #1f2937", margin: "10px 0" }} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {message.streaming && message.content && (
            <span style={{
              display: "inline-block", width: 7, height: 14,
              background: agentConfig?.color ?? "#3b82f6",
              borderRadius: 2, marginLeft: 2,
              animation: "os-pulse 0.7s infinite",
            }} />
          )}
        </div>

        {/* Navigate pill */}
        {message.navigate && (
          <div style={{
            marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6,
            background: "#1e3a5f", padding: "3px 10px", borderRadius: 99,
            fontSize: 11, color: "#3b82f6",
          }}>
            📍 Navigated to <code style={{ fontFamily: CODE_FONT }}>{message.navigate}</code>
          </div>
        )}

        {/* Decision card */}
        {message.beslissing && !message.beslissingResolved && (
          <DecisionCard
            question={message.beslissing.question}
            optionA={message.beslissing.optionA}
            optionB={message.beslissing.optionB}
            onChoose={(choice) => onResolveBeslissing(message.id, choice)}
          />
        )}

        <p style={{ fontSize: 10, color: "#374151", margin: "3px 4px 0" }}>{ts}</p>
      </div>
    </div>
  );
}
