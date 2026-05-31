"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, Camera, ChevronDown, MapPin } from "lucide-react";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

// ════════════════════════════════════════════════════════════════
// VAKMAN — Spoed oproepen
// ════════════════════════════════════════════════════════════════

type SpoedOproep = {
  id: string;
  naam: string;
  initial: string;
  avatarBg: string;
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
    id: "s1", naam: "Anita van der Berg", initial: "A", avatarBg: "#C97A4D",
    buurt: "Prinsengracht", afstand: "0,8 km", tijdGeleden: "2 min geleden", isUrgent: true,
    titel: "Lekkende kraan in keuken",
    omschrijving: "Druipt onder het aanrecht, water staat al op de vloer. Hoofdkraan dicht.",
    prijsRange: "€85 – €120", duur: "~45 min", fotos: 2,
  },
  {
    id: "s2", naam: "Renée Bosma", initial: "R", avatarBg: "#2B4030",
    buurt: "De Pijp", afstand: "2,4 km", tijdGeleden: "6 min geleden", isUrgent: false,
    titel: "WC spoelt niet door",
    omschrijving: "Enige toilet in huis, gezin met kleine kinderen. Verstopping vermoed.",
    prijsRange: "€95 – €140", duur: "~60 min",
  },
];

const OUD_OPROEP = { titel: "Geen warm water meer", klant: "Mehmet Y.", buurt: "Oud-West", afstand: "4,1 km", tijdGeleden: "12 min geleden" };

function VakmanSpoed() {
  const [beschikbaar, setBeschikbaar] = useState(true);
  const [afgewezen, setAfgewezen] = useState<string[]>([]);
  const [aangenomen, setAangenomen] = useState<string[]>([]);
  const zichtbaar = OPROEPEN.filter(o => !afgewezen.includes(o.id) && !aangenomen.includes(o.id));

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>
      <div className="sticky top-0 z-20 px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>Oproepen in de buurt</p>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>Spoed</h2>
      </div>

      <div className="px-5 pb-28">
        {/* Beschikbaarheid dark card */}
        <div style={{
          background: "#1A1D1A", color: "#F5EFE5", borderRadius: 14,
          padding: "14px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: beschikbaar ? "#C97A4D" : "#3A3D3A",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Zap size={18} style={{ color: "#1A1D1A" }} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Beschikbaar voor spoed</p>
            <p style={{ fontSize: 11, color: "#B8B4A8", margin: "2px 0 0" }}>Binnen 8 km · vandaag tot 22:00</p>
          </div>
          <button className="touch-scale" onClick={() => setBeschikbaar(v => !v)} style={{
            width: 40, height: 22, background: beschikbaar ? "#C97A4D" : "#3A3D3A",
            borderRadius: 99, position: "relative", border: "none", cursor: "pointer", flexShrink: 0,
          }}>
            <span style={{
              position: "absolute", top: 3,
              left: beschikbaar ? "calc(100% - 19px)" : 3,
              width: 16, height: 16, background: "#1A1D1A",
              borderRadius: "50%", transition: "left 0.15s",
            }} />
          </button>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: 0 }}>Binnenkomend</p>
          <span style={{ fontSize: 11, color: "#8A8A83" }}>{zichtbaar.length} oproepen</span>
        </div>

        {/* Oproep cards */}
        {zichtbaar.map(o => (
          <div key={o.id} style={{
            background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderLeft: "3px solid #C97A4D",
            borderRadius: 12, padding: 16, marginBottom: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", background: o.avatarBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: SERIF, fontSize: 16,
                  color: o.avatarBg === "#C97A4D" ? "#1A1D1A" : "#F5EFE5", flexShrink: 0,
                }}>{o.initial}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{o.naam}</p>
                  <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>{o.buurt}  ·  {o.afstand}</p>
                </div>
              </div>
              <span style={{ fontSize: 10, color: o.isUrgent ? "#C97A4D" : "#8A8A83", fontWeight: o.isUrgent ? 500 : 400 }}>
                {o.tijdGeleden}
              </span>
            </div>

            <p style={{ fontFamily: SERIF, fontSize: 17, margin: "0 0 4px", color: "#1A1D1A" }}>{o.titel}</p>
            <p style={{ fontSize: 12, color: "#5C5C56", margin: "0 0 12px", lineHeight: 1.4 }}>{o.omschrijving}</p>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              <span style={{ fontFamily: SERIF, fontSize: 12, padding: "3px 10px", background: "#EDE4D2", borderRadius: 6, color: "#1A1D1A" }}>
                {o.prijsRange}
              </span>
              <span style={{ fontSize: 11, padding: "3px 10px", background: "#EDE4D2", borderRadius: 6, color: "#5C5C56", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> {o.duur}
              </span>
              {o.fotos && (
                <span style={{ fontSize: 11, padding: "3px 10px", background: "#EDE4D2", borderRadius: 6, color: "#5C5C56", display: "flex", alignItems: "center", gap: 4 }}>
                  <Camera size={11} /> {o.fotos} foto&apos;s
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button className="touch-scale" onClick={() => setAangenomen(v => [...v, o.id])} style={{
                flex: 2, padding: 10, fontSize: 13, fontWeight: 500,
                background: "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 10, cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}>Aannemen</button>
              <button className="touch-scale" onClick={() => setAfgewezen(v => [...v, o.id])} style={{
                flex: 1, padding: 10, fontSize: 13,
                background: "transparent", color: "#5C5C56", border: "0.5px solid #E5DDD0",
                borderRadius: 10, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>Doorlaten</button>
            </div>
          </div>
        ))}

        {aangenomen.length > 0 && (
          <div style={{
            background: "#FBF7F0", border: "0.5px solid #2B4030",
            borderRadius: 12, padding: "14px 16px", marginBottom: 10, opacity: 0.85,
          }}>
            <p style={{ fontFamily: SERIF, fontSize: 15, margin: 0, color: "#2B4030" }}>
              ✓ {aangenomen.length} oproep aangenomen
            </p>
          </div>
        )}

        {/* Collapsed old */}
        <div style={{
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 12, padding: "14px 16px", opacity: 0.75,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 15, margin: 0, color: "#1A1D1A" }}>{OUD_OPROEP.titel}</p>
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

// ════════════════════════════════════════════════════════════════
// KLANT — Spoed formulier
// ════════════════════════════════════════════════════════════════

const KLANT_CATS = [
  { id: "lekkage",       label: "Lekkage",          emoji: "💧" },
  { id: "geen-stroom",   label: "Geen stroom",       emoji: "⚡" },
  { id: "verstopping",   label: "Verstopping",       emoji: "🚽" },
  { id: "geen-warm-water", label: "Geen warm water", emoji: "🚿" },
  { id: "slot-stuk",     label: "Slot stuk",         emoji: "🔑" },
  { id: "iets-anders",   label: "Iets anders",       emoji: "🛠️" },
];

function KlantSpoed() {
  const { address } = useUserStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [omschrijving, setOmschrijving] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>
        <div className="sticky top-0 z-20 px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>Spoed</h2>
        </div>
        <div className="px-5 pb-28" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 48, textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <Zap size={28} style={{ color: "#F5EFE5" }} />
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 24, color: "#1A1D1A", margin: "0 0 8px" }}>Verstuurd!</p>
          <p style={{ fontSize: 13, color: "#5C5C56", maxWidth: 280 }}>
            Je oproep is verstuurd naar 8 vakmensen in de buurt. Je krijgt binnen 5 minuten een reactie.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        {/* Icon + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#1A1D1A", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={16} style={{ color: "#C97A4D" }} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>Spoed</h2>
        </div>
      </div>

      <div className="px-5 pb-28">
        {/* Hero */}
        <h1 style={{
          fontFamily: SERIF, fontSize: 28, fontWeight: 400,
          margin: "0 0 24px", color: "#1A1D1A", lineHeight: 1.1,
        }}>
          Wat is er<br />
          <span style={{ fontStyle: "italic", color: "#8A8A83" }}>aan de hand?</span>
        </h1>

        {/* Category grid 2-koloms */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
          {KLANT_CATS.map(cat => {
            const isSelected = selected === cat.id;
            return (
              <button key={cat.id} className="touch-scale" onClick={() => setSelected(cat.id)} style={{
                padding: "14px 12px", borderRadius: 12, cursor: "pointer",
                background: isSelected ? "#1A1D1A" : "#FBF7F0",
                border: isSelected ? "none" : "0.5px solid #E5DDD0",
                display: "flex", alignItems: "center", gap: 10,
                textAlign: "left",
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: isSelected ? "#C97A4D" : "#EDE4D2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>{cat.emoji}</span>
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: isSelected ? "#F5EFE5" : "#1A1D1A",
                  fontFamily: "'Inter', sans-serif",
                }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#8A8A83", display: "block", marginBottom: 6, fontWeight: 500 }}>
            Omschrijving
          </label>
          <textarea
            value={omschrijving}
            onChange={e => setOmschrijving(e.target.value)}
            placeholder="Beschrijf wat er aan de hand is…"
            rows={3}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "0.5px solid #E5DDD0", background: "#FBF7F0",
              fontSize: 14, color: "#1A1D1A", resize: "none",
              fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Photo upload */}
        <div style={{
          marginBottom: 16, padding: "16px",
          border: "1px dashed #E5DDD0", borderRadius: 10,
          background: "#FBF7F0",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer",
        }}>
          <Camera size={18} style={{ color: "#8A8A83" }} />
          <span style={{ fontSize: 13, color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
            Foto&apos;s toevoegen
          </span>
        </div>

        {/* Address */}
        <div style={{
          marginBottom: 22, padding: "12px 14px",
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
        }}>
          <MapPin size={15} style={{ color: "#2B4030", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#1A1D1A", flex: 1 }}>
            {address || "Amsterdam"}
          </span>
          <button style={{
            fontSize: 12, color: "#2B4030", fontWeight: 500,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}>Wijzig</button>
        </div>

        {/* Submit */}
        <button
          className="touch-scale"
          onClick={() => selected && setSent(true)}
          style={{
            width: "100%", padding: "14px", fontSize: 14, fontWeight: 500,
            background: selected ? "#2B4030" : "#E5DDD0",
            color: selected ? "#F5EFE5" : "#8A8A83",
            border: "none", borderRadius: 10, cursor: selected ? "pointer" : "default",
            fontFamily: "'Inter', sans-serif", marginBottom: 10,
          }}
        >
          Stuur naar vakmensen in de buurt
        </button>

        <p style={{ fontSize: 11, color: "#8A8A83", textAlign: "center" }}>
          ≈ 5 min responstijd · 8 vakmensen beschikbaar
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Main — role switch
// ════════════════════════════════════════════════════════════════
export default function SpoedPage() {
  const { activeView } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return activeView === "vakman" ? <VakmanSpoed /> : <KlantSpoed />;
}
