"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { parseStreamChunk } from "@/lib/os/streamParser";

export type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  agentKey?: AgentKey;
  timestamp: number;
  streaming?: boolean;
  navigate?: string;
  highlight?: string;
  beslissing?: { question: string; optionA: string; optionB: string };
  beslissingResolved?: boolean;
};

const STORAGE_KEY = (agent: AgentKey) => `servr-os-chat-${agent}`;
const MAX_HISTORY = 40;

function loadHistory(agentKey: AgentKey): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(agentKey));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(agentKey: AgentKey, messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY(agentKey), JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {}
}

export type AgentStatus = "idle" | "active" | "done";

export function useAgentChat(agentKey: AgentKey) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [lastActive, setLastActive] = useState<string>("—");
  const abortRef = useRef<AbortController | null>(null);

  // Load from localStorage on mount / agent switch
  useEffect(() => {
    setMessages(loadHistory(agentKey));
    setStatus("idle");
  }, [agentKey]);

  const sendMessage = useCallback(async (command: string) => {
    if (!command.trim() || status === "active") return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: command,
      timestamp: Date.now(),
    };

    const agentMsgId = `a-${Date.now()}`;
    const agentMsg: Message = {
      id: agentMsgId,
      role: "agent",
      agentKey,
      content: "",
      timestamp: Date.now(),
      streaming: true,
    };

    setMessages(prev => {
      const next = [...prev, userMsg, agentMsg];
      saveHistory(agentKey, next);
      return next;
    });
    setStatus("active");
    const now = new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
    setLastActive(now);

    // Build history for API (exclude the empty agent msg we just added)
    const history = loadHistory(agentKey)
      .filter(m => m.role === "user" || (m.role === "agent" && m.content))
      .slice(-20)
      .map(m => ({ role: m.role === "user" ? "user" : "assistant" as const, content: m.content }));

    abortRef.current = new AbortController();
    let fullText = "";

    try {
      const res = await fetch("/api/os/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, agentName: agentKey, history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });

        const parsed = parseStreamChunk(fullText);

        setMessages(prev => prev.map(m =>
          m.id === agentMsgId
            ? { ...m, content: parsed.text, navigate: parsed.navigate, highlight: parsed.highlight, beslissing: parsed.beslissing, streaming: true }
            : m
        ));
      }

      const finalParsed = parseStreamChunk(fullText);
      setMessages(prev => {
        const next = prev.map(m =>
          m.id === agentMsgId
            ? { ...m, content: finalParsed.text, navigate: finalParsed.navigate, highlight: finalParsed.highlight, beslissing: finalParsed.beslissing, streaming: false }
            : m
        );
        saveHistory(agentKey, next);
        return next;
      });
      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Onbekende fout";
      setMessages(prev => {
        const next = prev.map(m =>
          m.id === agentMsgId
            ? { ...m, content: `❌ ${msg}`, streaming: false }
            : m
        );
        saveHistory(agentKey, next);
        return next;
      });
      setStatus("idle");
    }
  }, [agentKey, status]);

  const resolveBeslissing = useCallback((msgId: string, chosen: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, beslissingResolved: true } : m));
    sendMessage(chosen);
  }, [sendMessage]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY(agentKey));
  }, [agentKey]);

  return { messages, status, lastActive, sendMessage, resolveBeslissing, clearHistory };
}
