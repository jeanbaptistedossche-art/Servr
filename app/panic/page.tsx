"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, Camera, ChevronDown } from "lucide-react";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

// ── Mock spoed oproepen ──────────────────────────────────────
type SpoedOproep = {
  id: string;
  naam: string;
  initial: string;
  avatarBg: string;     // copper = urgent, forest = normaal
  buurt: string;
  afstand: string;
  tijdGeleden: string;
  isUrgent: boolean;
  titel: string;
  omschrijving: string;
  prijsRange: string;
  duur: string;
  fotos?: number;
};

const OPROEPEN: SpoedOproep[] = [
  {
    id: "s1",
    naam: "Anita van der Berg",
    initial: "A",
    avatarBg: "#C97A4D",
    buurt: "Prinsengracht",
    afstand: "0,8 km",
    tijdGeleden: "2 min geleden",
    isUrgent: true,
    titel: "Lekkende kraan in keuken",
    omschrijving: "Druipt onder het aanrecht, water staat al op de vloer. Hoofdkraan dicht.",
    prijsRange: "€85 – €120",
    duur: "~45 min",
    fotos: 2,
  },
  {
    id: "s2",
    naam: "Renée Bosma",
    initial: "R",
    avatarBg: "#2B4030",
    buurt: "De Pijp",
    afstand: "2,4 km",
    tijdGeleden: "6 min geleden",
    isUrgent: false,
    titel: "WC spoelt niet door",
    omschrijving: "Enige toilet in huis, gezin met kleine kinderen. Verstopping vermoed.",
    prijsRange: "€95 – €140",
    duur: "~60 min",
  },
];

const OUD_OPROEP = {
  titel: "Geen warm water meer",
  klant: "Mehmet Y.",
  buurt: "Oud-West",
  afstand: "4,1 km",
  tijdGeleden: "12 min geleden",
};

// ── Vakman Spoed page ────────────────────────────────────────
export default function SpoedPage() {
  const { activeView } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [beschikbaar, setBeschikbaar] = useState(true);
  const [afgewezen, setAfgewezen] = useState<string[]>([]);
  const [aangenomen, setAangenomen] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  const isVakman = !mounted || activeView === "vakman";
  const zichtbaar = OPROEPEN.filter(o => !afgewezen.includes(o.id) && !aangenomen.includes(o.id));

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>
          Oproepen in de buurt
        </p>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>
          Spoed
        </h2>
      </div>

      <div className="px-5 pb-28">

        {/* ── Beschikbaarheid dark card ── */}
        <div style={{
          background: "#1A1D1A", color: "#F5EFE5",
          borderRadius: 14, padding: "14px 16px",
          marginBottom: 22,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          {/* Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: beschikbaar ? "#C97A4D" : "#3A3D3A",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Zap size={18} style={{ color: "#1A1D1A" }} strokeWidth={2.5} />
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Beschikbaar voor spoed</p>
            <p style={{ fontSize: 11, color: "#B8B4A8", margin: "2px 0 0" }}>
              Binnen 8 km · vandaag tot 22:00
            </p>
          </div>

          {/* Toggle */}
          <button
            className="touch-scale"
            onClick={() => setBeschikbaar(v => !v)}
            style={{
              width: 40, height: 22,
              background: beschikbaar ? "#C97A4D" : "#3A3D3A",
              borderRadius: 99, position: "relative",
              border: "none", cursor: "pointer", flexShrink: 0,
            }}
            aria-label="Beschikbaarheid wisselen"
          >
            <span style={{
              position: "absolute",
              top: 3,
              left: beschikbaar ? "calc(100% - 19px)" : 3,
              width: 16, height: 16,
              background: "#1A1D1A",
              borderRadius: "50%",
              transition: "left 0.15s",
            }} />
          </button>
        </div>

        {/* ── Binnenkomend header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "baseline", marginBottom: 10,
        }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: 0 }}>
            Binnenkomend
          </p>
          <span style={{ fontSize: 11, color: "#8A8A83" }}>{zichtbaar.length} oproepen</span>
        </div>

        {/* ── Oproep cards ── */}
        {zichtbaar.map(o => (
          <div key={o.id} style={{
            background: "#FBF7F0",
            border: "0.5px solid #E5DDD0",
            borderLeft: "3px solid #C97A4D",
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
          }}>
            {/* Header row */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: 10,
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: o.avatarBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: SERIF, fontSize: 16,
                  color: o.avatarBg === "#C97A4D" ? "#1A1D1A" : "#F5EFE5",
                  flexShrink: 0,
                }}>
                  {o.initial}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{o.naam}</p>
                  <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>
                    {o.buurt}  ·  {o.afstand}
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: 10,
                color: o.isUrgent ? "#C97A4D" : "#8A8A83",
                fontWeight: o.isUrgent ? 500 : 400,
              }}>
                {o.tijdGeleden}
              </span>
            </div>

            {/* Title + description */}
            <p style={{ fontFamily: SERIF, fontSize: 17, margin: "0 0 4px", color: "#1A1D1A" }}>
              {o.titel}
            </p>
            <p style={{ fontSize: 12, color: "#5C5C56", margin: "0 0 12px", lineHeight: 1.4 }}>
              {o.omschrijving}
            </p>

            {/* Chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{
                fontFamily: SERIF, fontSize: 12, padding: "3px 10px",
                background: "#EDE4D2", borderRadius: 6, color: "#1A1D1A",
              }}>{o.prijsRange}</span>
              <span style={{
                fontSize: 11, padding: "3px 10px",
                background: "#EDE4D2", borderRadius: 6, color: "#5C5C56",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Clock size={11} /> {o.duur}
              </span>
              {o.fotos && (
                <span style={{
                  fontSize: 11, padding: "3px 10px",
                  background: "#EDE4D2", borderRadius: 6, color: "#5C5C56",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Camera size={11} /> {o.fotos} foto&apos;s
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="touch-scale"
                onClick={() => setAangenomen(v => [...v, o.id])}
                style={{
                  flex: 2, padding: 10, fontSize: 13, fontWeight: 500,
                  background: "#2B4030", color: "#F5EFE5",
                  border: "none", borderRadius: 10, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Aannemen
              </button>
              <button
                className="touch-scale"
                onClick={() => setAfgewezen(v => [...v, o.id])}
                style={{
                  flex: 1, padding: 10, fontSize: 13,
                  background: "transparent", color: "#5C5C56",
                  border: "0.5px solid #E5DDD0", borderRadius: 10, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Doorlaten
              </button>
            </div>
          </div>
        ))}

        {/* Aangenomen bevestiging */}
        {aangenomen.length > 0 && (
          <div style={{
            background: "#FBF7F0", border: "0.5px solid #2B4030",
            borderRadius: 12, padding: "14px 16px", marginBottom: 10,
            opacity: 0.85,
          }}>
            <p style={{ fontFamily: SERIF, fontSize: 15, margin: 0, color: "#2B4030" }}>
              ✓ {aangenomen.length} oproep aangenomen
            </p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "4px 0 0" }}>
              De klant wordt op de hoogte gebracht.
            </p>
          </div>
        )}

        {/* Collapsed old request */}
        <div style={{
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 12, padding: "14px 16px", opacity: 0.75,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 15, margin: 0, color: "#1A1D1A" }}>
                {OUD_OPROEP.titel}
              </p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>
                {OUD_OPROEP.klant} · {OUD_OPROEP.buurt} · {OUD_OPROEP.afstand} · {OUD_OPROEP.tijdGeleden}
              </p>
            </div>
            <ChevronDown size={14} style={{ color: "#8A8A83", flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
