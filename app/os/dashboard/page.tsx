"use client";

import { useState, useEffect, useRef } from "react";
import OSTopbar from "@/components/os/OSTopbar";

const KPI_DATA = [
  { label: "REVENUE TODAY", value: "€247", numVal: 247, prefix: "€", suffix: "", delta: "+32%", deltaUp: true, color: "#00e096", spark: [120, 180, 150, 200, 160, 220, 247] },
  { label: "ACTIVE WAT", value: "14", numVal: 14, prefix: "", suffix: "", delta: "+3 this week", deltaUp: true, color: "#4880ff", spark: [8, 9, 11, 10, 12, 13, 14] },
  { label: "OPEN JOBS", value: "7", numVal: 7, prefix: "", suffix: " jobs", delta: "2 urgent", deltaUp: false, color: "#ffaa30", spark: [4, 6, 5, 8, 7, 9, 7] },
  { label: "HEALTH SCORE", value: "87", numVal: 87, prefix: "", suffix: "%", delta: "↑4 vs last week", deltaUp: true, color: "#00dcff", spark: [72, 78, 75, 80, 83, 85, 87] },
];

const LIVE_EVENTS = [
  { color: "#00e096", text: "Thomas V. boekte loodgieter — €180", time: "2m ago", amount: "+€180" },
  { color: "#4880ff", text: "GPS tracking deploy geslaagd — v2.4.1", time: "5m ago" },
  { color: "#ff5faa", text: "Marketing: TikTok video 2.4k views", time: "8m ago" },
  { color: "#00e096", text: "Ahmed B. betaalde factuur #2341 — €340", time: "12m ago", amount: "+€340" },
  { color: "#9060ff", text: "Data agent: churn risk 3 users", time: "18m ago" },
  { color: "#ffaa30", text: "Finance: Exact Online sync — 14 facturen", time: "22m ago" },
  { color: "#ff3c5a", text: "Scout: Werkspot verhoogt commissie 18%", time: "25m ago" },
  { color: "#00e096", text: "Klant Maria D. gaf 5⭐ review", time: "31m ago" },
];

const AGENTS_ORBIT = [
  { key: "ceo", label: "CEO", color: "#9060ff", angle: 0, r: 90 },
  { key: "product", label: "PROD", color: "#00e096", angle: 45, r: 105 },
  { key: "intel", label: "INTEL", color: "#00dcff", angle: 90, r: 95 },
  { key: "data", label: "DATA", color: "#9060ff", angle: 135, r: 108 },
  { key: "finance", label: "FIN", color: "#ffaa30", angle: 180, r: 98 },
  { key: "ops", label: "OPS", color: "#4880ff", angle: 225, r: 102 },
  { key: "trust", label: "TRUST", color: "#ff3c5a", angle: 270, r: 95 },
  { key: "marketing", label: "MKT", color: "#ff5faa", angle: 315, r: 106 },
];

function KPICard({ kpi }: { kpi: typeof KPI_DATA[0] }) {
  const [displayed, setDisplayed] = useState(0);
  const svgW = 80, svgH = 28;
  const max = Math.max(...kpi.spark);
  const min = Math.min(...kpi.spark);
  const pts = kpi.spark.map((v, i) => {
    const x = (i / (kpi.spark.length - 1)) * svgW;
    const y = svgH - ((v - min) / (max - min + 1)) * (svgH - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  useEffect(() => {
    let start = 0;
    const end = kpi.numVal;
    const dur = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [kpi.numVal]);

  return (
    <div className="os-card" style={{ padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      {/* Pulse bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${kpi.color}66, transparent)`, animation: "os-breathe 3s infinite" }} />

      <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: ".14em", color: "rgba(238,240,255,.4)", marginBottom: 8 }}>{kpi.label}</div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color, letterSpacing: "-.03em", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>
            {kpi.prefix}{displayed}{kpi.suffix}
          </div>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: kpi.deltaUp ? "#00e096" : "#ffaa30", marginTop: 6 }}>
            {kpi.deltaUp ? "↑" : "↓"} {kpi.delta}
          </div>
        </div>
        <svg width={svgW} height={svgH} style={{ opacity: .5 }}>
          <polyline points={pts} fill="none" stroke={kpi.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function ConstellationSVG() {
  const [selected, setSelected] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const svgSize = 300;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  useEffect(() => {
    let raf: number;
    const animate = () => { setRotation(r => (r + 0.08) % 360); raf = requestAnimationFrame(animate); };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={svgSize} height={svgSize} style={{ overflow: "visible" }}>
        {/* Orbit rings */}
        {[90, 105].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(72,128,255,.08)" strokeWidth={1} strokeDasharray="4 8" />
        ))}

        {/* Rotating outer ring */}
        <circle cx={cx} cy={cy} r={120} fill="none" stroke="rgba(72,128,255,.06)" strokeWidth={1} strokeDasharray="2 10"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }} />

        {/* Connection lines + particles */}
        {AGENTS_ORBIT.map(ag => {
          const rad = (ag.angle * Math.PI) / 180;
          const x = cx + Math.cos(rad) * ag.r;
          const y = cy + Math.sin(rad) * ag.r;
          return (
            <line key={ag.key} x1={cx} y1={cy} x2={x} y2={y}
              stroke={`${ag.color}22`} strokeWidth={1}
              strokeDasharray="3 6"
            />
          );
        })}

        {/* Agent nodes */}
        {AGENTS_ORBIT.map(ag => {
          const rad = (ag.angle * Math.PI) / 180;
          const x = cx + Math.cos(rad) * ag.r;
          const y = cy + Math.sin(rad) * ag.r;
          const isSel = selected === ag.key;
          return (
            <g key={ag.key} style={{ cursor: "pointer" }} onClick={() => setSelected(isSel ? null : ag.key)}>
              <circle cx={x} cy={y} r={isSel ? 20 : 16} fill={`${ag.color}18`} stroke={ag.color} strokeWidth={isSel ? 2 : 1} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={9} fill={ag.color} fontFamily="'JetBrains Mono', monospace" fontWeight={700}>{ag.label}</text>
              {isSel && <circle cx={x} cy={y} r={24} fill="none" stroke={ag.color} strokeWidth={1} opacity={.4} />}
            </g>
          );
        })}

        {/* JB center */}
        <circle cx={cx} cy={cy} r={26} fill="rgba(5,8,20,.9)" stroke="rgba(72,128,255,.4)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={32} fill="none" stroke="rgba(72,128,255,.15)" strokeWidth={1} style={{ animation: "os-breathe 3s infinite" }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fill="#eef0ff" fontFamily="'Space Grotesk', sans-serif" fontWeight={800}>JB</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize={7} fill="rgba(238,240,255,.4)" fontFamily="'JetBrains Mono', monospace">CEO</text>
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState(LIVE_EVENTS);

  useEffect(() => {
    const id = setInterval(() => {
      const ev = LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)];
      setEvents(prev => [{ ...ev, time: "now" }, ...prev.slice(0, 10)]);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <OSTopbar />

      {/* Breadcrumb */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.28)" }}>
          servr-os / <span style={{ color: "rgba(238,240,255,.6)" }}>dashboard</span>
        </span>
      </div>

      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {KPI_DATA.map(kpi => <KPICard key={kpi.label} kpi={kpi} />)}
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 16, flex: 1 }}>

          {/* Column 1: Agent constellation */}
          <div className="os-card" style={{ padding: "18px" }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: ".14em", color: "rgba(238,240,255,.3)", marginBottom: 16 }}>AGENT CONSTELLATION</div>
            <ConstellationSVG />
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {AGENTS_ORBIT.map(ag => (
                <span key={ag.key} style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: ag.color, background: `${ag.color}12`, border: `1px solid ${ag.color}22`, borderRadius: 4, padding: "2px 6px" }}>
                  ● {ag.label}
                </span>
              ))}
            </div>
          </div>

          {/* Column 2: Live feed + alerts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Live feed */}
            <div className="os-card" style={{ padding: "18px", flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: ".14em", color: "rgba(238,240,255,.3)", marginBottom: 12 }}>LIVE FEED</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto" }}>
                {events.map((ev, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: i === 0 ? "os-fadeup .4s both" : "none" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color, flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontSize: 12, color: "rgba(238,240,255,.7)", flex: 1, lineHeight: 1.4 }}>{ev.text}</span>
                    {ev.amount && <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#00e096", fontWeight: 700, flexShrink: 0 }}>{ev.amount}</span>}
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.25)", flexShrink: 0 }}>{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* E4 threat */}
              <div className="os-card" style={{ padding: "14px 16px", borderColor: "rgba(255,170,48,.25)", background: "rgba(255,170,48,.04)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,170,48,.5), transparent)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#ffaa30", background: "rgba(255,170,48,.15)", border: "1px solid rgba(255,170,48,.3)", borderRadius: 4, padding: "2px 6px" }}>E4 THREAT</span>
                  <span style={{ fontSize: 10, color: "rgba(238,240,255,.4)", fontFamily: "'JetBrains Mono', monospace" }}>Scout · 8m ago</span>
                  <span style={{ marginLeft: "auto", color: "rgba(238,240,255,.3)", fontSize: 14 }}>›</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#eef0ff" }}>Werkspot verhoogt commissie naar 18%</div>
                <div style={{ fontSize: 11, color: "rgba(238,240,255,.45)", marginTop: 4 }}>Impact: €2.4K/maand — directe reactie vereist</div>
              </div>

              {[
                { tag: "E3", text: "3 churn risks: Data agent alert", color: "#ff3c5a" },
                { tag: "E3", text: "Fixly haalt €2M funding: sectorshift", color: "#ff3c5a" },
              ].map((alert, i) => (
                <div key={i} className="os-card" style={{ padding: "12px 14px", borderColor: `rgba(255,60,90,.15)` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#ff3c5a", background: "rgba(255,60,90,.12)", border: "1px solid rgba(255,60,90,.25)", borderRadius: 4, padding: "2px 6px" }}>{alert.tag}</span>
                    <span style={{ fontSize: 12, color: "rgba(238,240,255,.7)", flex: 1 }}>{alert.text}</span>
                    <span style={{ color: "rgba(238,240,255,.3)", fontSize: 14 }}>›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Business pulse */}
          <div className="os-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: ".14em", color: "rgba(238,240,255,.3)" }}>BUSINESS PULSE</div>

            {/* Revenue chart */}
            <div>
              <div style={{ fontSize: 11, color: "rgba(238,240,255,.5)", marginBottom: 8 }}>Revenue — last 7 days</div>
              <svg width="100%" height={60} viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e096" stopOpacity=".3" />
                    <stop offset="100%" stopColor="#00e096" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points="0,50 33,35 66,42 100,20 133,30 166,10 200,5" fill="none" stroke="#00e096" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="0,50 33,35 66,42 100,20 133,30 166,10 200,5 200,60 0,60" fill="url(#revenueGrad)" />
              </svg>
            </div>

            {/* WAT trend */}
            <div>
              <div style={{ fontSize: 11, color: "rgba(238,240,255,.5)", marginBottom: 8 }}>WAT — last 4 weeks</div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 40 }}>
                {[8, 10, 12, 14].map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", height: `${(v / 14) * 36}px`, background: `linear-gradient(180deg, #4880ff, rgba(72,128,255,.4))`, borderRadius: 3 }} />
                    <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: "rgba(238,240,255,.3)" }}>W{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel */}
            <div>
              <div style={{ fontSize: 11, color: "rgba(238,240,255,.5)", marginBottom: 8 }}>Conversion funnel</div>
              {[
                { label: "Visitors", pct: 100, color: "#4880ff" },
                { label: "Leads", pct: 32, color: "#9060ff" },
                { label: "Bookings", pct: 8, color: "#00e096" },
              ].map((step, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: "rgba(238,240,255,.5)" }}>{step.label}</span>
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: step.color, fontWeight: 700 }}>{step.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,.05)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${step.pct}%`, background: `linear-gradient(90deg, ${step.color}88, ${step.color})`, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Top agents */}
            <div>
              <div style={{ fontSize: 11, color: "rgba(238,240,255,.5)", marginBottom: 8 }}>Top agents this week</div>
              {[
                { name: "Operations", tasks: 147, color: "#4880ff" },
                { name: "Finance", tasks: 91, color: "#ffaa30" },
                { name: "Marketing", tasks: 63, color: "#ff5faa" },
              ].map((ag, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: "rgba(238,240,255,.6)" }}>{i + 1}. {ag.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: ag.color, fontWeight: 700 }}>{ag.tasks} tasks</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
