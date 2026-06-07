"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AgentKey } from "@/lib/os/agentConfig";
import { parseStreamText } from "@/lib/os/streamParser";

export type AgentStatus = "idle" | "active" | "done";

export type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  agentKey?: AgentKey;
  timestamp: number;
  streaming?: boolean;
  navigate?: string;
  highlight?: string;
  switchAgent?: AgentKey;
  askAgent?: { key: AgentKey; question: string };
  beslissing?: { question: string; optionA: string; optionB: string };
  beslissingResolved?: boolean;
};

const STORAGE_KEY = (agent: AgentKey) => `servr-os-chat-${agent}`;
const MAX_STORED = 40;

function loadHistory(agentKey: AgentKey): Message[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(agentKey)) ?? "[]");
  } catch { return []; }
}

function saveHistory(agentKey: AgentKey, messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY(agentKey), JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {}
}

type Histories = Record<AgentKey, Message[]>;

export function useAgentChat() {
  // Visible state starts EMPTY elke sessie — geen oude chats zichtbaar.
  // localStorage wordt bewaard als stille API-context: de agent heeft geheugen,
  // maar de gebruiker ziet alleen berichten van de huidige sessie.
  const [histories, setHistories] = useState<Histories>({
    ceo: [], cto: [], scout: [], validator: [],
  });

  const [statusMap, setStatusMap] = useState<Record<AgentKey, AgentStatus>>({
    ceo: "idle", cto: "idle", scout: "idle", validator: "idle",
  });

  const [lastActiveMap, setLastActiveMap] = useState<Record<AgentKey, string>>({
    ceo: "—", cto: "—", scout: "—", validator: "—",
  });

  const abortRef = useRef<AbortController | null>(null);

  const getMessages = useCallback((key: AgentKey) => histories[key] ?? [], [histories]);
  const getStatus   = useCallback((key: AgentKey) => statusMap[key] ?? "idle", [statusMap]);
  const getLastActive = useCallback((key: AgentKey) => lastActiveMap[key] ?? "—", [lastActiveMap]);

  function setAgentMessages(key: AgentKey, updater: (prev: Message[]) => Message[]) {
    setHistories(prev => {
      const next = { ...prev, [key]: updater(prev[key] ?? []) };
      saveHistory(key, next[key]);
      return next;
    });
  }

  const sendMessage = useCallback(async (
    agentKey: AgentKey,
    command: string,
    onSwitchAgent?: (key: AgentKey, autoQuestion?: string) => void
  ) => {
    if (!command.trim() || statusMap[agentKey] === "active") return;

    const now = new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

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

    setAgentMessages(agentKey, prev => [...prev, userMsg, agentMsg]);
    setStatusMap(prev => ({ ...prev, [agentKey]: "active" }));
    setLastActiveMap(prev => ({ ...prev, [agentKey]: now }));

    // API-context: lees uit localStorage (stille geheugen) + huidige sessie berichten.
    // Zo heeft de agent geheugen van vorige sessies zonder dat de gebruiker die ziet.
    const storedHistory = loadHistory(agentKey);
    const currentVisible = (histories[agentKey] ?? []).filter(m => m.content?.trim() && !m.streaming);
    const combined = [...storedHistory, ...currentVisible];
    // Dedup op id, neem laatste 20
    const seen = new Set<string>();
    const apiHistory = combined
      .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; })
      .filter(m => m.content?.trim())
      .slice(-20)
      .map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let fullText = "";

    try {
      const res = await fetch("/api/os/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // THE FIX: agentName is explicitly set from the agentKey parameter
        body: JSON.stringify({ agentName: agentKey, command, history: apiHistory }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.text();
        throw new Error(err || "Serverfout");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const parsed = parseStreamText(fullText);
        setAgentMessages(agentKey, prev =>
          prev.map(m => m.id === agentMsgId
            ? { ...m, content: parsed.text, navigate: parsed.navigate, highlight: parsed.highlight, switchAgent: parsed.switchAgent, askAgent: parsed.askAgent, beslissing: parsed.beslissing, streaming: true }
            : m
          )
        );
      }

      const finalParsed = parseStreamText(fullText);
      setAgentMessages(agentKey, prev =>
        prev.map(m => m.id === agentMsgId
          ? { ...m, content: finalParsed.text, navigate: finalParsed.navigate, highlight: finalParsed.highlight, switchAgent: finalParsed.switchAgent, askAgent: finalParsed.askAgent, beslissing: finalParsed.beslissing, streaming: false }
          : m
        )
      );
      setStatusMap(prev => ({ ...prev, [agentKey]: "done" }));

      // ASK_AGENT: switch + automatisch vraag doorsturen (meeting flow)
      if (finalParsed.askAgent && onSwitchAgent) {
        const { key, question } = finalParsed.askAgent;
        setTimeout(() => onSwitchAgent(key, question), 1200);
        return;
      }

      // SWITCH_AGENT: alleen switchen, geen vraag
      if (finalParsed.switchAgent && onSwitchAgent) {
        setTimeout(() => onSwitchAgent(finalParsed.switchAgent!), 1800);
      }

    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Onbekende fout";
      setAgentMessages(agentKey, prev =>
        prev.map(m => m.id === agentMsgId ? { ...m, content: `❌ ${msg}`, streaming: false } : m)
      );
      setStatusMap(prev => ({ ...prev, [agentKey]: "idle" }));
    }
  }, [histories, statusMap]);

  const resolveBeslissing = useCallback((agentKey: AgentKey, msgId: string) => {
    setAgentMessages(agentKey, prev =>
      prev.map(m => m.id === msgId ? { ...m, beslissingResolved: true } : m)
    );
  }, []);

  const clearHistory = useCallback((agentKey: AgentKey) => {
    setAgentMessages(agentKey, () => []);
    setStatusMap(prev => ({ ...prev, [agentKey]: "idle" }));
  }, []);

  return { getMessages, getStatus, getLastActive, sendMessage, resolveBeslissing, clearHistory };
}
