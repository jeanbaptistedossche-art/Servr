"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Navigation } from "lucide-react";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

const DAYS_NL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
const MONTHS_NL = ["januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"];

const NU_BEZIG = {
  tijd: "10:00 – 12:00",
  overtijd: "+2u 14m",
  titel: "CV-ketel inspectie",
  klant: "Thomas Bakker",
  adres: "Keizersgracht 312",
};

const DAARNA = [
  { tijd: "13:30", titel: "Stopcontact plaatsen", extra: "3×", klant: "Sofia Martins", afstand: "1.9 km", bedrag: "€95" },
  { tijd: "15:30", titel: "Badkamertegels herstellen", klant: "Piet Jansen", afstand: "1.8 km", bedrag: "€110" },
];

export default function VandaagPage() {
  const { name, role, activeView, setActiveView } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Goedemorgen," : hour < 18 ? "Goedemiddag," : "Goedenavond,";
  const firstName = mounted && name ? name.split(" ")[0] : "Dossche";
  const dateStr = `${DAYS_NL[now.getDay()]} ${now.getDate()} ${MONTHS_NL[now.getMonth()]}`;

  const isVakman = mounted ? activeView === "vakman" : true;
  const hasBoth = role === "beide";

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#8A8A83", margin: 0 }}>
              {greeting}
            </p>
            <p style={{ fontSize: 16, fontWeight: 500, margin: "2px 0 0", color: "#1A1D1A" }}>
              {firstName}
            </p>
          </div>

          {hasBoth && (
            <button
              className="touch-scale flex"
              style={{ padding: 3, background: "#EDE4D2", borderRadius: 99, border: "none", cursor: "pointer" }}
              onClick={() => setActiveView(isVakman ? "klant" : "vakman")}
            >
              <span style={{
                fontSize: 11, padding: "5px 11px",
                color: isVakman ? "#5C5C56" : "#F5EFE5",
                background: isVakman ? "transparent" : "#2B4030",
                borderRadius: 99, fontWeight: isVakman ? 400 : 500,
              }}>Klant</span>
              <span style={{
                fontSize: 11, padding: "5px 11px",
                color: isVakman ? "#F5EFE5" : "#5C5C56",
                background: isVakman ? "#2B4030" : "transparent",
                borderRadius: 99, fontWeight: isVakman ? 500 : 400,
              }}>Vakman</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-28">

        {/* Date + Hero */}
        <p style={{ fontSize: 11, color: "#8A8A83", margin: "0 0 4px" }}>{dateStr}</p>
        <h1 style={{
          fontFamily: SERIF, fontSize: 34, fontWeight: 400,
          margin: "0 0 26px", color: "#1A1D1A", lineHeight: 1.05,
        }}>
          Drie klussen<br />
          <span style={{ color: "#8A8A83", fontStyle: "italic" }}>vandaag.</span>
        </h1>

        {/* Stats 3-col grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          background: "#E5DDD0", gap: "0.5px", borderRadius: 12,
          overflow: "hidden", marginBottom: 26,
        }}>
          {[
            { label: "Werk",   value: "6 u",  color: "#1A1D1A" },
            { label: "Reizen", value: "8 km", color: "#1A1D1A" },
            { label: "Omzet",  value: "€290", color: "#2B4030" },
          ].map(s => (
            <div key={s.label} style={{ background: "#FBF7F0", padding: "14px 10px" }}>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: 0 }}>{s.label}</p>
              <p style={{ fontFamily: SERIF, fontSize: 22, margin: "4px 0 0", color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Nu bezig label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
          <span style={{
            display: "inline-block", width: 7, height: 7,
            borderRadius: "50%", background: "#C97A4D", flexShrink: 0,
          }} />
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: 0 }}>
            Nu bezig
          </p>
        </div>

        {/* Dark focus card */}
        <div style={{
          background: "#1A1D1A", color: "#F5EFE5",
          borderRadius: 14, padding: 18, marginBottom: 26,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: 0 }}>{NU_BEZIG.tijd}</p>
            <span style={{
              fontSize: 11, padding: "3px 9px",
              background: "#C97A4D", color: "#1A1D1A",
              borderRadius: 99, fontWeight: 500,
            }}>{NU_BEZIG.overtijd}</span>
          </div>

          <p style={{ fontFamily: SERIF, fontSize: 22, margin: "6px 0 3px" }}>{NU_BEZIG.titel}</p>
          <p style={{ fontSize: 12, color: "#B8B4A8", margin: "0 0 18px" }}>
            {NU_BEZIG.klant}  ·  {NU_BEZIG.adres}
          </p>

          <div style={{ display: "flex", gap: 6 }}>
            <button className="touch-scale" style={{
              flex: 1, padding: 11, fontSize: 13, fontWeight: 500,
              background: "#C97A4D", color: "#1A1D1A",
              border: "none", borderRadius: 10, cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}>
              Klaar markeren
            </button>
            <button className="touch-scale" style={{
              padding: "11px 12px", background: "transparent",
              color: "#F5EFE5", border: "0.5px solid #5C5C56",
              borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center",
            }} aria-label="Bericht">
              <MessageCircle size={15} />
            </button>
            <button className="touch-scale" style={{
              padding: "11px 12px", background: "transparent",
              color: "#F5EFE5", border: "0.5px solid #5C5C56",
              borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center",
            }} aria-label="Navigeer">
              <Navigation size={15} />
            </button>
          </div>
        </div>

        {/* Daarna */}
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: "0 0 0" }}>
          Daarna
        </p>

        {DAARNA.map((job, i) => (
          <div key={i} style={{
            display: "flex", padding: "14px 0",
            borderTop: "0.5px solid #E5DDD0",
            alignItems: "baseline",
          }}>
            <div style={{ width: 44, fontFamily: SERIF, fontSize: 16, color: "#1A1D1A", flexShrink: 0 }}>
              {job.tijd}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>
                {job.titel}
                {job.extra && <span style={{ color: "#8A8A83", fontWeight: 400 }}> {job.extra}</span>}
              </p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>
                {job.klant} · {job.afstand}
              </p>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 16, color: "#2B4030", flexShrink: 0 }}>
              {job.bedrag}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
