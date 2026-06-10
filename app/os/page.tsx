"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import OSTopbar from "@/components/os/OSTopbar";
import OSOrb, { OrbState } from "@/components/os/OSOrb";

// ── Types ────────────────────────────────────────────────────
type Mode = "talk" | "news" | "video" | "research" | "files" | "agents" | "execute" | "automations";
type ResultCard = { tag: string; color: string; title: string; sub: string; cta: string; hc: string };

// ── Constants ────────────────────────────────────────────────
const CAPABILITIES: { icon: string; label: Mode; color: string; placeholder: string }[] = [
  { icon: "💬", label: "talk",        color: "#4880ff", placeholder: "Ask anything about your business..." },
  { icon: "📡", label: "news",        color: "#ffaa30", placeholder: "Search latest market news and signals..." },
  { icon: "▶",  label: "video",       color: "#ff3c5a", placeholder: "Find and summarize video content..." },
  { icon: "🔬", label: "research",    color: "#00dcff", placeholder: "Deep research any topic or competitor..." },
  { icon: "📄", label: "files",       color: "#9060ff", placeholder: "Analyze uploaded files and documents..." },
  { icon: "⚡", label: "agents",      color: "#00e096", placeholder: "Coordinate agents and run automations..." },
  { icon: "🎯", label: "execute",     color: "#ff5faa", placeholder: "Execute a business action or workflow..." },
  { icon: "⚙",  label: "automations", color: "#6070ff", placeholder: "Set up or review automated workflows..." },
];

const MODE_LABELS: Record<Mode, string> = {
  talk: "TALK", news: "NEWS", video: "VIDEO", research: "RESEARCH",
  files: "FILES", agents: "AGENTS", execute: "EXECUTE", automations: "AUTO",
};

const LEFT_SIGNALS = [
  { color: "#00e096", tag: "BOOKING", title: "Live booking signal", sub: "Thomas V. — Loodgieter — €180", time: "2m ago" },
  { color: "#ff3c5a", tag: "E4 THREAT", title: "Werkspot verhoogt commissie", sub: "18% → impact €2.4K/maand", time: "8m ago" },
  { color: "#00e096", tag: "REVENUE", title: "Revenue signal up ↑32%", sub: "€247 vandaag vs €186 gisteren", time: "15m ago" },
  { color: "#4880ff", tag: "OPPORTUNITY", title: "3 nieuwe inbound leads", sub: "Via Google Ads — conversie 3.2%", time: "22m ago" },
];

const RIGHT_SIGNALS = [
  { color: "#00e096", tag: "AGENTS", title: "5/8 agents actief", sub: "Marketing + Ops + Finance live", time: "now" },
  { color: "#9060ff", tag: "MEMORY", title: "Last action: TikTok boost", sub: "Marketing agent — 2.4k views", time: "4m ago" },
  { color: "#4880ff", tag: "HEALTH", title: "System health 99.8%", sub: "No alerts — all green", time: "now" },
  { color: "#ffaa30", tag: "AUTOPILOT", title: "Confidence: 94%", sub: "8 workflows running cleanly", time: "now" },
];

const MOCK_RESULT_CARDS: ResultCard[] = [
  { tag: "NEWS", color: "#ffaa30", hc: "#ffaa30", title: "Werkspot verhoogt commissie naar 18%", sub: "Impact €2.4K/maand — Scout raadt directe reactie aan", cta: "Analyseer impact" },
  { tag: "DATA", color: "#4880ff", hc: "#4880ff", title: "Conversieratio stijgt naar 3.2%", sub: "A/B test variant B — +18% clicks vs baseline", cta: "Bekijk rapport" },
  { tag: "ACTION", color: "#00e096", hc: "#00e096", title: "Win-back campagne klaar", sub: "23 klanten identified — Marketing agent ready", cta: "Lanceer campagne" },
  { tag: "ALERT", color: "#ff3c5a", hc: "#ff3c5a", title: "3 churn risks geïdentificeerd", sub: "Data agent: hoge kans binnen 14 dagen", cta: "Bekijk profiel" },
];

const SHORTCUTS = ["/news", "/video", "/research", "/agents", "/execute"];

export default function OSHomePage() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [mode, setMode] = useState<Mode>("talk");
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [answer, setAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [leftSignals, setLeftSignals] = useState(LEFT_SIGNALS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 96) + "px";
  }, [input]);

  // Live signal refresh every 9s
  useEffect(() => {
    const id = setInterval(() => {
      const newSig = LEFT_SIGNALS[Math.floor(Math.random() * LEFT_SIGNALS.length)];
      setLeftSignals(prev => [{ ...newSig, time: "now" }, ...prev.slice(0, 3)]);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  const handleCapability = (cap: typeof CAPABILITIES[0]) => {
    setMode(cap.label);
    if (textareaRef.current) {
      textareaRef.current.placeholder = cap.placeholder;
      textareaRef.current.focus();
    }
  };

  const handleMic = () => {
    if (listening) {
      setListening(false);
      setOrbState("idle");
      setTranscript("");
    } else {
      setListening(true);
      setOrbState("listening");
      // Simulate transcript
      setTimeout(() => setTranscript("Wat is de status van mijn bedrijf?"), 1200);
      setTimeout(() => { setInput("Wat is de status van mijn bedrijf?"); setTranscript(""); setListening(false); }, 3000);
    }
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setOrbState("thinking");
    setStreaming(true);
    setShowCanvas(true);
    setAnswer("");
    if (canvasRef.current) canvasRef.current.scrollIntoView({ behavior: "smooth" });

    try {
      const res = await fetch("/api/os/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: text, agentName: "ceo", history: [] }),
      });
      if (!res.ok || !res.body) { setAnswer("Er ging iets mis. Probeer opnieuw."); return; }

      setOrbState("speaking");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setAnswer(acc);
      }
      setOrbState("executing");
      setTimeout(() => setOrbState("idle"), 1200);
    } catch {
      setAnswer("Verbindingsfout — controleer API key.");
    } finally {
      setStreaming(false);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const modeColor = CAPABILITIES.find(c => c.label === mode)?.color ?? "#4880ff";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Topbar */}
      <OSTopbar state={orbState} />

      {/* Main content */}
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 48, paddingBottom: 48 }}>

        {/* LEFT floating panels */}
        <div style={{
          position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: 10, zIndex: 10, width: 220,
        }}>
          {leftSignals.map((sig, i) => (
            <div key={i} className="os-card os-slide-left" style={{
              padding: "10px 14px", cursor: "pointer",
              transition: "transform .3s cubic-bezier(.2,.7,.3,1)",
              animationDelay: `${i * .08}s`,
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateX(3px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateX(0)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: sig.color, letterSpacing: ".12em" }}>
                  {sig.tag}
                </span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.28)" }}>{sig.time}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#eef0ff", lineHeight: 1.3 }}>{sig.title}</div>
              <div style={{ fontSize: 11, color: "rgba(238,240,255,.5)", marginTop: 2 }}>{sig.sub}</div>
              <div style={{ height: 1, background: `linear-gradient(90deg, ${sig.color}44, transparent)`, marginTop: 8 }} />
            </div>
          ))}
        </div>

        {/* RIGHT floating panels */}
        <div style={{
          position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: 10, zIndex: 10, width: 220,
        }}>
          {RIGHT_SIGNALS.map((sig, i) => (
            <div key={i} className="os-card os-slide-right" style={{
              padding: "10px 14px", cursor: "pointer",
              transition: "transform .3s cubic-bezier(.2,.7,.3,1)",
              animationDelay: `${i * .08}s`,
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateX(-3px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateX(0)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: sig.color, letterSpacing: ".12em" }}>
                  {sig.tag}
                </span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.28)" }}>{sig.time}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#eef0ff", lineHeight: 1.3 }}>{sig.title}</div>
              <div style={{ fontSize: 11, color: "rgba(238,240,255,.5)", marginTop: 2 }}>{sig.sub}</div>
            </div>
          ))}
        </div>

        {/* Center stage */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 680, width: "100%", padding: "0 16px" }}>

          {/* ORB */}
          <OSOrb state={orbState} onStateChange={setOrbState} />

          {/* Headline */}
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontSize: "clamp(32px, 5vw, 46px)",
              fontWeight: 800, letterSpacing: "-.04em",
              margin: 0, lineHeight: 1.1,
              background: "linear-gradient(135deg, #eef0ff 30%, rgba(100,130,255,.6) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              Talk to your business.
            </h1>
            <p style={{
              fontSize: 15, color: "rgba(238,240,255,.35)", margin: "12px 0 0",
              lineHeight: 1.6, maxWidth: 520,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              Ask questions, watch videos, read news, analyze files and execute work — from one AI command layer.
            </p>
          </div>

          {/* Command bar meta row */}
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: -16, padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: modeColor, display: "inline-block", animation: "os-breathe 2.4s infinite" }} />
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: modeColor, letterSpacing: ".14em", fontWeight: 700 }}>
                {MODE_LABELS[mode]}
              </span>
            </div>
            {transcript && (
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#00e096", animation: "os-fadeup .3s both" }}>
                {transcript}
              </span>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {SHORTCUTS.map(s => (
                <span key={s} style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.2)" }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Command bar */}
          <div style={{
            width: "100%",
            background: "rgba(255,255,255,.04)",
            border: `1px solid ${listening ? "rgba(0,224,150,.3)" : "rgba(255,255,255,.1)"}`,
            borderRadius: 20,
            display: "flex", alignItems: "flex-end", gap: 0,
            transition: "border-color .3s, box-shadow .3s",
            boxShadow: listening ? "0 0 0 4px rgba(0,224,150,.06)" : undefined,
          }}>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={CAPABILITIES.find(c => c.label === mode)?.placeholder ?? "Ask anything..."}
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                resize: "none", padding: "14px 16px",
                fontSize: 15, color: "#eef0ff",
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1.5, minHeight: 52, maxHeight: 96,
                overflowY: "auto",
              }}
            />

            {/* Divider */}
            <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,.07)", margin: "10px 0" }} />

            {/* Tools */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", flexShrink: 0 }}>
              {["📎", "📡", "▶"].map(icon => (
                <button key={icon} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 16, opacity: .45, padding: 4,
                  transition: "opacity .2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = ".45")}
                >{icon}</button>
              ))}

              {/* Mic */}
              <button onClick={handleMic} style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                background: listening ? "rgba(0,224,150,.2)" : "rgba(72,128,255,.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, transition: "all .3s",
                boxShadow: listening ? "0 0 16px rgba(0,224,150,.3)" : "none",
              }}>
                🎙
              </button>

              {/* Execute */}
              <button onClick={handleSend} className="os-btn-primary" style={{
                padding: "8px 18px", fontSize: 13, fontWeight: 700, borderRadius: 12,
                display: "flex", alignItems: "center", gap: 6,
                opacity: streaming ? .6 : 1,
                cursor: streaming ? "not-allowed" : "pointer",
              }}>
                {streaming ? "..." : "Execute"}
                {!streaming && <span style={{ fontSize: 11 }}>⚡</span>}
              </button>
            </div>
          </div>

          {/* Capability strip */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {CAPABILITIES.map(cap => (
              <button key={cap.label} onClick={() => handleCapability(cap)} style={{
                height: 36, padding: "0 14px",
                borderRadius: 100,
                background: mode === cap.label ? `${cap.color}18` : "rgba(255,255,255,.04)",
                border: `1px solid ${mode === cap.label ? cap.color + "44" : "rgba(255,255,255,.08)"}`,
                color: mode === cap.label ? cap.color : "rgba(238,240,255,.5)",
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                transition: "all .3s cubic-bezier(.2,.7,.3,1)",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = cap.color + "88";
                  e.currentTarget.style.boxShadow = `0 4px 16px ${cap.color}22`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = mode === cap.label ? cap.color + "44" : "rgba(255,255,255,.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span>{cap.icon}</span>
                <span style={{ textTransform: "capitalize" }}>{cap.label}</span>
              </button>
            ))}
          </div>

          {/* Work canvas */}
          {showCanvas && (
            <div ref={canvasRef} className="os-card os-card-active os-fadeup" style={{
              width: "100%", overflow: "hidden",
            }}>
              {/* Top border */}
              <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(72,128,255,.5), rgba(144,96,255,.35), transparent)" }} />

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, #4880ff, #9060ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>S</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#eef0ff" }}>Servr OS — CEO</span>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#00e096", marginLeft: 4 }}>● RESPONDING</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  {["Marketing", "Finance", "Scout"].map(ag => (
                    <span key={ag} style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.4)", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 4, padding: "2px 6px" }}>{ag}</span>
                  ))}
                </div>
                <button onClick={() => setShowCanvas(false)} style={{ background: "none", border: "none", color: "rgba(238,240,255,.3)", cursor: "pointer", fontSize: 16 }}>×</button>
              </div>

              {/* Answer */}
              <div style={{ padding: "18px 20px", fontSize: 13.5, lineHeight: 1.75, color: "#eef0ff", whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>
                {answer || <span style={{ color: "rgba(238,240,255,.3)", fontFamily: "'JetBrains Mono', monospace" }}>Analyseren...</span>}
              </div>

              {/* Result cards */}
              {answer && (
                <div style={{ padding: "0 18px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {MOCK_RESULT_CARDS.map((card, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,.03)",
                      border: `1px solid rgba(255,255,255,.07)`,
                      borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                      transition: "all .3s cubic-bezier(.2,.7,.3,1)",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = card.hc + "44"; e.currentTarget.style.boxShadow = `0 0 20px ${card.hc}14`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: card.color, letterSpacing: ".12em" }}>{card.tag}</span>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: card.color }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#eef0ff", lineHeight: 1.3, marginBottom: 4 }}>{card.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(238,240,255,.45)", lineHeight: 1.4, marginBottom: 8 }}>{card.sub}</div>
                      <button style={{ fontSize: 11, color: card.color, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{card.cta} →</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {answer && (
                <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", gap: 10 }}>
                  <button className="os-btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>Execute aanbeveling ⚡</button>
                  <button style={{
                    padding: "8px 18px", fontSize: 13, background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "rgba(238,240,255,.6)",
                    cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
                  }}>Opslaan in Brain</button>
                  <button style={{
                    padding: "8px 18px", fontSize: 13, background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "rgba(238,240,255,.6)",
                    cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
                  }}>Deel met team</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
