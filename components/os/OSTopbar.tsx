"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STATE_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  idle:      { label: "READY",     color: "#4880ff", dot: "●" },
  listening: { label: "LISTENING", color: "#00e096", dot: "◉" },
  thinking:  { label: "THINKING",  color: "#ffaa30", dot: "◌" },
  speaking:  { label: "SPEAKING",  color: "#00dcff", dot: "◆" },
  executing: { label: "EXECUTING", color: "#9060ff", dot: "▶" },
};

interface Props {
  state?: string;
}

export default function OSTopbar({ state = "idle" }: Props) {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const st = STATE_LABELS[state] ?? STATE_LABELS.idle;

  const navItems = [
    { href: "/os", label: "Home" },
    { href: "/os/agents", label: "Agents" },
    { href: "/os/workflows", label: "Workflows" },
    { href: "/os/dashboard", label: "Dashboard" },
    { href: "/os/brain", label: "Brain" },
    { href: "/os/war-room", label: "War Room" },
  ];

  return (
    <div style={{
      position: "relative", zIndex: 50,
      height: 44,
      background: "rgba(0,0,7,.8)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,.06)",
      display: "flex", alignItems: "center",
      padding: "0 16px",
      gap: 12,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <Link href="/os" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: "linear-gradient(135deg, #4880ff, #9060ff)",
          boxShadow: "0 0 12px rgba(72,128,255,.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif",
        }}>S</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#eef0ff", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-.02em" }}>
          Servr OS
        </span>
      </Link>

      {/* Divider */}
      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,.1)", flexShrink: 0 }} />

      {/* Sys dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e096", display: "inline-block", animation: "os-breathe 2.4s infinite" }} />
        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.35)", letterSpacing: ".1em" }}>
          {time}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 2, flex: 1, justifyContent: "center" }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== "/os" && pathname?.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              fontSize: 12, fontWeight: active ? 700 : 500,
              color: active ? "#eef0ff" : "rgba(238,240,255,.4)",
              fontFamily: "'Space Grotesk', sans-serif",
              textDecoration: "none",
              padding: "4px 10px",
              borderRadius: 6,
              background: active ? "rgba(72,128,255,.12)" : "transparent",
              border: active ? "1px solid rgba(72,128,255,.2)" : "1px solid transparent",
              transition: "all .2s",
            }}>{item.label}</Link>
          );
        })}
      </nav>

      {/* State badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "3px 10px",
        borderRadius: 20,
        background: "rgba(255,255,255,.04)",
        border: `1px solid ${st.color}44`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, color: st.color, animation: "os-breathe 2.4s infinite" }}>{st.dot}</span>
        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: st.color, letterSpacing: ".12em", fontWeight: 700 }}>
          {st.label}
        </span>
      </div>

      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg, #4880ff, #9060ff)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        border: "2px solid rgba(72,128,255,.3)",
        flexShrink: 0, cursor: "pointer",
      }}>JB</div>
    </div>
  );
}
