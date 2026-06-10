"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "executing";

const STATE_CONFIG: Record<OrbState, { color: string; label: string; glowColor: string; arcSpeed: number }> = {
  idle:      { color: "#4880ff", label: "IDLE",      glowColor: "72,128,255",  arcSpeed: 6 },
  listening: { color: "#00e096", label: "LISTENING", glowColor: "0,224,150",   arcSpeed: 2.5 },
  thinking:  { color: "#ffaa30", label: "THINKING",  glowColor: "255,170,48",  arcSpeed: 2 },
  speaking:  { color: "#00dcff", label: "SPEAKING",  glowColor: "0,220,255",   arcSpeed: 3 },
  executing: { color: "#9060ff", label: "EXECUTING", glowColor: "144,96,255",  arcSpeed: 1.2 },
};

interface Props {
  state?: OrbState;
  onStateChange?: (s: OrbState) => void;
}

const STATE_CYCLE: OrbState[] = ["idle", "listening", "thinking", "speaking"];

export default function OSOrb({ state = "idle", onStateChange }: Props) {
  const waveRef = useRef<HTMLCanvasElement>(null);
  const cfg = STATE_CONFIG[state];
  const [pulse, setPulse] = useState(false);

  // Fire pulse on executing
  useEffect(() => {
    if (state === "executing") { setPulse(true); setTimeout(() => setPulse(false), 900); }
  }, [state]);

  // Waveform canvas
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    let t = 0;
    const active = state !== "idle";

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = cx - 4;
      const pts = 100;
      const amp = active ? 14 : 4;

      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const angle = (i / pts) * Math.PI * 2;
        const noise = Math.sin(angle * 3 + t * 0.05) * amp * 0.4
          + Math.sin(angle * 7 - t * 0.08) * amp * 0.3
          + Math.sin(angle * 2 + t * 0.03) * amp * 0.3;
        const radius = r + noise;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const [r1, g1, b1] = cfg.glowColor.split(",").map(Number);
      grad.addColorStop(0, `rgba(${r1},${g1},${b1},.22)`);
      grad.addColorStop(1, `rgba(${r1},${g1},${b1},.06)`);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = `rgba(${r1},${g1},${b1},.35)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      t++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [state, cfg.glowColor]);

  const handleClick = useCallback(() => {
    if (!onStateChange) return;
    const i = STATE_CYCLE.indexOf(state as OrbState);
    onStateChange(STATE_CYCLE[(i + 1) % STATE_CYCLE.length]);
  }, [state, onStateChange]);

  const [r1, g1, b1] = cfg.glowColor.split(",").map(Number);

  return (
    <div style={{ position: "relative", width: 280, height: 280, cursor: "pointer", flexShrink: 0 }} onClick={handleClick}>
      {/* Halo */}
      <div style={{
        position: "absolute", inset: -50,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${r1},${g1},${b1},.08) 0%, transparent 70%)`,
        animation: "os-breathe 4s infinite",
        pointerEvents: "none",
      }} />

      {/* Rings */}
      {[
        { inset: -55, alpha: .06 }, { inset: -38, alpha: .10 },
        { inset: -22, alpha: .15 }, { inset: -8,  alpha: .22 },
      ].map((ring, i) => (
        <div key={i} style={{
          position: "absolute",
          inset: ring.inset,
          borderRadius: "50%",
          border: `1px solid rgba(${r1},${g1},${b1},${ring.alpha})`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Arc 3 — slow purple spin */}
      <div style={{
        position: "absolute", inset: -20,
        borderRadius: "50%",
        background: "conic-gradient(from 0deg, transparent 0%, rgba(144,96,255,.25) 30%, transparent 60%)",
        animation: `os-spin-rev ${14 / 1}s linear infinite`,
        pointerEvents: "none",
      }} />

      {/* Arc 2 — blue reverse */}
      <div style={{
        position: "absolute", inset: -12,
        borderRadius: "50%",
        background: "conic-gradient(from 120deg, transparent 0%, rgba(72,128,255,.3) 25%, transparent 50%)",
        animation: `os-spin-rev ${10 / 1}s linear infinite`,
        pointerEvents: "none",
      }} />

      {/* Arc 1 — state reactive */}
      <div style={{
        position: "absolute", inset: -4,
        borderRadius: "50%",
        background: `conic-gradient(from 240deg, transparent 0%, rgba(${r1},${g1},${b1},.5) 20%, rgba(144,96,255,.3) 40%, transparent 60%)`,
        animation: `os-spin ${cfg.arcSpeed}s linear infinite`,
        pointerEvents: "none",
      }} />

      {/* Orbiting particles */}
      {[
        { color: "#00dcff", r: 155, speed: 5, offset: 0 },
        { color: "#9060ff", r: 140, speed: 7, offset: 120 },
        { color: "#4880ff", r: 148, speed: 9, offset: 240 },
      ].map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: 6, height: 6,
          marginTop: -3, marginLeft: -3,
          borderRadius: "50%",
          background: p.color,
          boxShadow: `0 0 8px ${p.color}`,
          animation: `os-spin ${p.speed}s linear infinite`,
          transformOrigin: `${p.r - 3}px 3px`,
          transform: `rotate(${p.offset}deg) translateX(${p.r}px)`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Orb core */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, rgba(${r1},${g1},${b1},.35) 0%, rgba(5,8,20,.95) 65%, rgba(0,0,7,1) 100%)`,
        border: "1px solid rgba(120,170,255,.25)",
        boxShadow: [
          `0 0 40px rgba(${r1},${g1},${b1},.25)`,
          `0 0 80px rgba(${r1},${g1},${b1},.1)`,
          `inset 0 0 40px rgba(${r1},${g1},${b1},.08)`,
          `inset 0 1px 0 rgba(255,255,255,.15)`,
        ].join(", "),
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 4,
      }}>
        {/* Specular highlight */}
        <div style={{
          position: "absolute", top: "15%", left: "20%",
          width: "35%", height: "25%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Waveform canvas */}
        <canvas ref={waveRef} width={280} height={280} style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          opacity: state !== "idle" ? 1 : 0.4,
          transition: "opacity .5s",
        }} />

        {/* State label */}
        <span style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700, letterSpacing: ".14em",
          color: cfg.color,
          position: "relative", zIndex: 1,
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Pulse ring on execute */}
      {pulse && (
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: `2px solid rgba(${r1},${g1},${b1},.8)`,
          animation: "os-pulse-ring .8s cubic-bezier(.2,.7,.3,1) forwards",
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}
