"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

const NAV = [
  { href: "/os", label: "Home" },
  { href: "/os/agents", label: "Agents" },
  { href: "/os/workflows", label: "Workflows" },
  { href: "/os/dashboard", label: "Dashboard" },
  { href: "/os/brain", label: "Brain" },
  { href: "/os/war-room", label: "War Room" },
];

const CAPS = [
  { icon: "💬", label: "Talk",        color: "#4880ff" },
  { icon: "📡", label: "News",        color: "#ffaa30" },
  { icon: "▶",  label: "Video",       color: "#ff3c5a" },
  { icon: "🔬", label: "Research",    color: "#00dcff" },
  { icon: "📄", label: "Files",       color: "#9060ff" },
  { icon: "⚡", label: "Agents",      color: "#00e096" },
  { icon: "🎯", label: "Execute",     color: "#ff5faa" },
  { icon: "⚙",  label: "Automations", color: "#6070ff" },
];

export default function OSHomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [time, setTime] = useState("");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeMode, setActiveMode] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Orb pulse on streaming
  useEffect(() => {
    if (streaming) setPulse(true);
    else setTimeout(() => setPulse(false), 600);
  }, [streaming]);

  // Starfield canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const stars: { x: number; y: number; r: number; phase: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0;
      for (let i = 0; i < 180; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.4 + 0.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Nebula
      const g1 = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.4, 0, canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.35);
      g1.addColorStop(0, "rgba(72,128,255,0.04)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const g2 = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.6, 0, canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.3);
      g2.addColorStop(0, "rgba(144,96,255,0.04)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      stars.forEach(s => {
        const a = 0.4 + 0.6 * Math.sin(t * 0.8 + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(238,240,255,${a})`;
        ctx.fill();
      });

      t += 0.016;
      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setStreaming(true);
    setAnswer("");
    try {
      const res = await fetch("/api/os/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: text, agentName: "ceo", history: [] }),
      });
      if (!res.ok || !res.body) { setAnswer("Er ging iets mis."); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let out = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
        setAnswer(out);
      }
    } catch {
      setAnswer("Verbindingsfout.");
    } finally {
      setStreaming(false);
    }
  }, [input]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000007", overflow: "hidden", fontFamily: "'Space Grotesk', system-ui, sans-serif", color: "#eef0ff" }}>

      {/* Starfield */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(72,128,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(72,128,255,.03) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }} />

      {/* Topbar */}
      <div style={{
        position: "relative", zIndex: 10,
        height: 44, display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
        background: "rgba(0,0,7,.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,.06)",
      }}>
        {/* Logo */}
        <Link href="/os" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#4880ff,#9060ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", boxShadow: "0 0 12px rgba(72,128,255,.5)" }}>S</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#eef0ff" }}>Servr OS</span>
        </Link>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,.1)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e096", display: "inline-block" }} />
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(238,240,255,.35)", letterSpacing: ".1em" }}>{time}</span>
        </div>
        <nav style={{ display: "flex", gap: 2, flex: 1, justifyContent: "center" }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} style={{
              fontSize: 12, fontWeight: item.href === "/os" ? 700 : 500,
              color: item.href === "/os" ? "#eef0ff" : "rgba(238,240,255,.4)",
              textDecoration: "none", padding: "4px 10px", borderRadius: 6,
              background: item.href === "/os" ? "rgba(72,128,255,.12)" : "transparent",
              border: item.href === "/os" ? "1px solid rgba(72,128,255,.2)" : "1px solid transparent",
            }}>{item.label}</Link>
          ))}
        </nav>
        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#00e096", letterSpacing: ".12em", fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(0,224,150,.06)", border: "1px solid rgba(0,224,150,.2)" }}>
          ◉ READY
        </div>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4880ff,#9060ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", border: "2px solid rgba(72,128,255,.3)" }}>JB</div>
      </div>

      {/* Main area */}
      <div style={{ position: "relative", zIndex: 1, height: "calc(100vh - 44px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: "0 16px" }}>

        {/* Headline */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "#4880ff", letterSpacing: ".2em", marginBottom: 12, fontWeight: 700 }}>SERVR OS — FOUNDER MODE</div>
          <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.1, margin: 0 }}>
            Talk to your business.
          </h1>
          <p style={{ fontSize: 16, color: "rgba(238,240,255,.45)", marginTop: 10, fontWeight: 400 }}>
            AI-first command center — powered by 19 agents
          </p>
        </div>

        {/* Orb */}
        <div style={{ position: "relative", width: 120, height: 120 }}>
          {/* Outer glow ring */}
          <div style={{
            position: "absolute", inset: -20,
            borderRadius: "50%",
            background: streaming
              ? "radial-gradient(circle, rgba(72,128,255,.25) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(72,128,255,.12) 0%, transparent 70%)",
            transition: "background .5s",
          }} />
          {/* Main orb */}
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            background: streaming
              ? "radial-gradient(circle at 38% 35%, #6090ff 0%, #2040cc 45%, #0a0a30 100%)"
              : "radial-gradient(circle at 38% 35%, #4880ff 0%, #1830a0 45%, #050510 100%)",
            boxShadow: streaming
              ? "0 0 60px rgba(72,128,255,.7), 0 0 120px rgba(72,128,255,.3), inset 0 0 40px rgba(144,96,255,.3)"
              : "0 0 40px rgba(72,128,255,.4), 0 0 80px rgba(72,128,255,.15), inset 0 0 30px rgba(144,96,255,.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
            transition: "all .4s",
            animation: streaming ? "none" : "os-breathe 3s ease-in-out infinite",
          }}>
            {streaming ? "⚡" : "🧠"}
          </div>
        </div>

        {/* Mode chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {CAPS.map((c, i) => (
            <button key={i} onClick={() => setActiveMode(i)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20,
              background: activeMode === i ? `${c.color}18` : "rgba(255,255,255,.04)",
              border: `1px solid ${activeMode === i ? `${c.color}55` : "rgba(255,255,255,.08)"}`,
              color: activeMode === i ? c.color : "rgba(238,240,255,.5)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Space Grotesk',sans-serif",
              transition: "all .2s",
            }}>
              <span>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>

        {/* Command bar */}
        <div style={{ width: "100%", maxWidth: 680, position: "relative" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`${CAPS[activeMode].label}: Ask anything about your business...`}
            rows={1}
            style={{
              width: "100%", padding: "16px 56px 16px 20px",
              background: "rgba(5,8,20,.9)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(72,128,255,.25)", borderRadius: 16,
              color: "#eef0ff", fontSize: 15, fontFamily: "'Space Grotesk',sans-serif",
              resize: "none", outline: "none", boxSizing: "border-box",
              boxShadow: "0 0 40px rgba(72,128,255,.1)",
            }}
          />
          <button onClick={handleSend} disabled={streaming || !input.trim()} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            width: 36, height: 36, borderRadius: 10,
            background: streaming ? "rgba(72,128,255,.2)" : "linear-gradient(135deg,#4880ff,#9060ff)",
            border: "none", cursor: streaming ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#fff",
            boxShadow: streaming ? "none" : "0 0 16px rgba(72,128,255,.4)",
          }}>
            {streaming ? "⏳" : "→"}
          </button>
        </div>

        {/* Streaming answer */}
        {answer && (
          <div style={{
            width: "100%", maxWidth: 680,
            padding: "18px 20px",
            background: "rgba(5,8,20,.85)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(72,128,255,.15)", borderRadius: 16,
            fontSize: 14, lineHeight: 1.7, color: "rgba(238,240,255,.85)",
            maxHeight: 220, overflowY: "auto",
          }}>
            {answer}
            {streaming && <span style={{ opacity: .6 }}> ▋</span>}
          </div>
        )}

        {/* Quick shortcuts */}
        <div style={{ display: "flex", gap: 8 }}>
          {["Daily brief", "Revenue today", "Top priority", "Risks", "What's live?"].map((s, i) => (
            <button key={i} onClick={() => { setInput(s); }} style={{
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              color: "rgba(238,240,255,.45)", fontSize: 11, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".05em",
              transition: "all .2s",
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Live ticker */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 28, zIndex: 20,
        background: "rgba(0,0,7,.95)", borderTop: "1px solid rgba(72,128,255,.15)",
        display: "flex", alignItems: "center", overflow: "hidden",
      }}>
        <div style={{ flexShrink: 0, padding: "0 12px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#ff3c5a", letterSpacing: ".15em", borderRight: "1px solid rgba(255,255,255,.08)" }}>LIVE</div>
        <div style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
          <span style={{ display: "inline-block", animation: "os-marquee 32s linear infinite", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(238,240,255,.4)", letterSpacing: ".06em" }}>
            ◆ Servr OS active — 19 agents standby &nbsp;&nbsp;&nbsp; ◆ Revenue signal nominal &nbsp;&nbsp;&nbsp; ◆ 0 critical alerts &nbsp;&nbsp;&nbsp; ◆ All systems operational &nbsp;&nbsp;&nbsp; ◆ Founder mode enabled &nbsp;&nbsp;&nbsp; ◆ Type a command to begin &nbsp;&nbsp;&nbsp;
          </span>
        </div>
        <div style={{ flexShrink: 0, padding: "0 12px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#00e096", letterSpacing: ".08em" }}>
          {time} ● LIVE
        </div>
      </div>

      <style>{`
        @keyframes os-breathe { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.04);opacity:.85} }
        @keyframes os-marquee { 0%{transform:translateX(100vw)} 100%{transform:translateX(-100%)} }
      `}</style>
    </div>
  );
}
