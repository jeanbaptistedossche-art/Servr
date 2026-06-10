"use client";

import { useState, useRef, useEffect } from "react";
import OSTopbar from "@/components/os/OSTopbar";
import { AGENTS, AGENT_KEYS, AgentKey } from "@/lib/os/agentConfig";

type MessageRole = "user" | "agent" | "system";
interface Message {
  id: string;
  role: MessageRole;
  agent?: AgentKey;
  content: string;
  thinking?: boolean;
}

const SHORTCUTS = ["DAILY BRIEF", "AUDIT", "SPRINT", "WAR ROOM", "RED TEAM", "LAUNCH CHECK", "COMPETITOR STRIKE", "MORNING BRIEF"];

const INITIAL_MESSAGES: Message[] = [
  { id: "sys1", role: "system", content: "War Room geactiveerd — alle 8 agents online. CEO coördineert." },
  {
    id: "agent1", role: "agent", agent: "ceo",
    content: "War Room staat klaar. Stuur een commando — ik coördineer alle agents en geef je een gecombineerde SITREP.\n\nSnel starten:\n- **DAILY BRIEF** — overzicht van gisteren + vandaag\n- **AUDIT** — kritische check van alle systemen\n- **RED TEAM** — ik probeer het businessmodel kapot te maken\n- **LAUNCH CHECK** — 47-punten checklist voor go/no-go",
  },
];

const AGENT_RESPONSES: Partial<Record<AgentKey, string[]>> = {
  scout:      ["Werkspot heeft gisteren commissie verhoogd naar 18%. Dit is een E4 signal. Directe actie vereist binnen 48u.", "Fixly haalt €2M funding — focus op plumbers en electricians. Vergelijkbaar met ons core segment."],
  marketing:  ["TikTok campagne runt op €50/dag. CTR 3.8%, boven benchmark. Advies: verhoog naar €75/dag voor de komende 3 dagen."],
  data:       ["3 churn risks geïdentificeerd: users die >14 dagen inactief zijn. Win-back campaign ready — 23 profielen."],
  finance:    ["Cash flow: 18 maanden runway. MRR €4.820, ↑8% MoM. Werkspot impact €2.4K/maand als we niets doen."],
  operations: ["Alle systemen groen. Uptime 99.8%. Geen incidents. GPS tracking deploy op 67% — ETA 2u."],
  cto:        ["GPS tracking: 67% complete. Blocker: Supabase RLS policy voor realtime updates. Fix: 1 lijn in policy.sql. ETA live: 2u."],
};

function AgentThinking({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} className={`os-dot${i + 1}`} style={{
          width: 6, height: 6, borderRadius: "50%", background: color,
        }} />
      ))}
    </div>
  );
}

export default function WarRoomPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [activeAgents, setActiveAgents] = useState<Set<AgentKey>>(new Set(["ceo", "cto", "scout", "marketing", "data", "finance", "operations"]));
  const [streaming, setStreaming] = useState(false);
  const [thinkingAgents, setThinkingAgents] = useState<AgentKey[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingAgents]);

  const toggleAgent = (key: AgentKey) => {
    setActiveAgents(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    // Show thinking agents
    const consultedAgents = Array.from(activeAgents).filter(k => k !== "ceo").slice(0, 4) as AgentKey[];
    setThinkingAgents(consultedAgents);

    // Simulate agent responses sequentially
    for (let i = 0; i < consultedAgents.length; i++) {
      await new Promise(r => setTimeout(r, 800 + i * 600));
      const agKey = consultedAgents[i];
      const responses = AGENT_RESPONSES[agKey] ?? [`${AGENTS[agKey].name}: analyse compleet — alles nominaal.`];
      const resp = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, {
        id: `agent-${agKey}-${Date.now()}`,
        role: "agent",
        agent: agKey,
        content: resp,
      }]);
      setThinkingAgents(prev => prev.filter(k => k !== agKey));
    }

    // CEO synthesis
    await new Promise(r => setTimeout(r, 1000));
    setMessages(prev => [...prev, {
      id: `ceo-${Date.now()}`,
      role: "agent",
      agent: "ceo",
      content: `**SITREP — CEO synthese**\n\nOp basis van alle agent inputs:\n\n1. **Werkspot (URGENT):** E4 signal. Scout + Finance bevestigen €2.4K/maand impact. Actie: win-back campagne + pricing review binnen 24u.\n2. **Product:** GPS tracking 67% — CTO haalt het vandaag. Geen blokkade.\n3. **Marketing:** TikTok werkt. Verhoog budget €50 → €75/dag.\n4. **Finance:** Cash flow gezond — 18 maanden runway.\n\n**Volgende stap:** Schrijf reactie op Werkspot-stijging vandaag. Marketing agent staat klaar.`,
    }]);

    setStreaming(false);
    setThinkingAgents([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <OSTopbar />

      {/* Agent status row */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        background: "rgba(0,0,7,.6)",
        display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
      }}>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)", letterSpacing: ".14em", flexShrink: 0 }}>AGENTS:</span>
        {AGENT_KEYS.map(key => {
          const ag = AGENTS[key];
          const isActive = activeAgents.has(key);
          return (
            <button key={key} onClick={() => toggleAgent(key)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
              borderRadius: 6, border: `1px solid ${isActive ? ag.color + "44" : "rgba(255,255,255,.06)"}`,
              background: isActive ? `${ag.color}10` : "rgba(255,255,255,.03)",
              color: isActive ? ag.color : "rgba(238,240,255,.3)",
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, cursor: "pointer",
              transition: "all .2s",
            }}>
              <span style={{ fontSize: 8, animation: isActive && ag.status === "LIVE" ? "os-breathe 2s infinite" : "none" }}>●</span>
              {ag.name}
            </button>
          );
        })}
      </div>

      {/* Message thread */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map(msg => {
          if (msg.role === "system") {
            return (
              <div key={msg.id} style={{ textAlign: "center" }}>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.25)", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 4, padding: "4px 10px" }}>
                  {msg.content}
                </span>
              </div>
            );
          }

          if (msg.role === "user") {
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{
                  maxWidth: 600, padding: "12px 16px",
                  background: "linear-gradient(135deg, rgba(32,96,255,.3), rgba(112,48,255,.2))",
                  border: "1px solid rgba(72,128,255,.25)", borderRadius: 12, borderBottomRightRadius: 4,
                  fontSize: 14, color: "#eef0ff", lineHeight: 1.6, whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            );
          }

          const ag = msg.agent ? AGENTS[msg.agent] : null;
          return (
            <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "os-fadeup .4s both" }}>
              {ag && (
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 2,
                  background: `${ag.color}18`, border: `1px solid ${ag.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>{ag.emoji}</div>
              )}
              <div style={{
                maxWidth: 680,
                borderLeft: ag ? `2px solid ${ag.color}44` : "none",
                paddingLeft: ag ? 12 : 0,
              }}>
                {ag && (
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8" }}>
                    <span style={{ color: ag.color, fontWeight: 700 }}>{ag.name}</span>
                    <span style={{ color: "rgba(238,240,255,.25)" }}>·</span>
                    <span style={{ color: "rgba(238,240,255,.25)" }}>just now</span>
                  </div>
                )}
                <div style={{ fontSize: 13.5, color: "rgba(238,240,255,.85)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                  {msg.content.split("**").map((part, i) =>
                    i % 2 === 1
                      ? <strong key={i} style={{ color: "#eef0ff", fontWeight: 700 }}>{part}</strong>
                      : part
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking indicators */}
        {thinkingAgents.map(key => {
          const ag = AGENTS[key];
          return (
            <div key={`thinking-${key}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: `${ag.color}18`, border: `1px solid ${ag.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>{ag.emoji}</div>
              <div style={{ borderLeft: `2px solid ${ag.color}44`, paddingLeft: 12 }}>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: ag.color, fontWeight: 700, display: "block", marginBottom: 6 }}>{ag.name}</span>
                <AgentThinking color={ag.color} />
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Command input */}
      <div style={{
        padding: "12px 16px 16px",
        borderTop: "1px solid rgba(255,255,255,.06)",
        background: "rgba(0,0,7,.75)", backdropFilter: "blur(20px)",
      }}>
        {/* Shortcuts */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {SHORTCUTS.map(sc => (
            <button key={sc} onClick={() => setInput(sc)} style={{
              padding: "4px 10px", fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 6, color: "rgba(238,240,255,.45)", cursor: "pointer",
              transition: "all .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(72,128,255,.3)"; e.currentTarget.style.color = "#4880ff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "rgba(238,240,255,.45)"; }}
            >{sc}</button>
          ))}
        </div>

        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 16, padding: "8px 12px",
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Commando aan alle agents... (Enter om te sturen)"
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              resize: "none", fontSize: 14, color: "#eef0ff",
              fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.5,
              minHeight: 42, maxHeight: 120, overflowY: "auto",
            }}
          />
          <button onClick={handleSend} className="os-btn-primary" style={{
            padding: "10px 20px", fontSize: 13, borderRadius: 10, flexShrink: 0,
            opacity: streaming ? .5 : 1, cursor: streaming ? "not-allowed" : "pointer",
          }}>
            {streaming ? "War Room actief..." : "Send ⚡"}
          </button>
        </div>
      </div>
    </div>
  );
}
