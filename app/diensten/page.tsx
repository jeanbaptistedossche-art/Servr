"use client";

import { useState } from "react";
import { Plus, Pencil, X, Check } from "lucide-react";
import { MOCK_DIENSTEN, type Dienst } from "@/lib/bedrijfStore";

const SERIF = "'Source Serif 4', Georgia, serif";

function duurLabel(min: number) {
  const u = Math.floor(min / 60), m = min % 60;
  return u > 0 ? `${u}u${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

// ── Toggle component ──────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className="touch-scale flex-shrink-0"
      onClick={onToggle}
      style={{
        width: 32, height: 18,
        background: on ? "#2B4030" : "#D3D1C7",
        borderRadius: 99, position: "relative",
        border: "none", cursor: "pointer",
        flexShrink: 0,
      }}
      aria-label={on ? "Deactiveer" : "Activeer"}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: on ? "calc(100% - 16px)" : 2,
        width: 14, height: 14,
        background: "#F5EFE5",
        borderRadius: "50%",
        transition: "left 0.15s",
      }} />
    </button>
  );
}

// ── Service card ──────────────────────────────────────────────
function DienstKaart({ dienst, onToggle, onEdit }: {
  dienst: Dienst;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const priceLabel = dienst.eenheid === "vast bedrag"
    ? `€${dienst.prijs}`
    : `€${dienst.prijs}/${dienst.eenheid === "per uur" ? "u" : dienst.eenheid}`;

  const metaLabel = [
    dienst.eenheid === "vast bedrag" ? "vast" : null,
    `${duurLabel(dienst.duurMinuten)}${dienst.bufferMinuten > 0 ? ` + ${duurLabel(dienst.bufferMinuten)} buffer` : ""}`,
    dienst.btw ? "BTW 21%" : null,
  ].filter(Boolean).join("  ·  ");

  return (
    <div style={{
      background: "#FBF7F0",
      border: "0.5px solid #E5DDD0",
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      opacity: dienst.actief ? 1 : 0.65,
      transition: "opacity 0.2s",
    }}>
      {/* Name + toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <p style={{ fontFamily: SERIF, fontSize: 17, margin: 0, color: "#1A1D1A" }}>
          {dienst.naam}
        </p>
        <Toggle on={dienst.actief} onToggle={onToggle} />
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: "#8A8A83", margin: "0 0 12px" }}>
        {dienst.beschrijving}
      </p>

      {/* Footer */}
      <div style={{
        display: "flex", gap: 14, alignItems: "baseline",
        paddingTop: 12, borderTop: "0.5px solid #E5DDD0",
      }}>
        <span style={{
          fontFamily: SERIF, fontSize: 15,
          color: dienst.actief ? "#2B4030" : "#8A8A83",
        }}>{priceLabel}</span>
        <span style={{ fontSize: 11, color: "#8A8A83", flex: 1 }}>{metaLabel}</span>
        <button
          className="touch-scale"
          onClick={onEdit}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="Bewerken"
        >
          <Pencil size={15} style={{ color: dienst.actief ? "#1A1D1A" : "#8A8A83" }} />
        </button>
      </div>
    </div>
  );
}

// ── Simple edit form overlay ──────────────────────────────────
function EditForm({ dienst, onSave, onCancel }: {
  dienst: Dienst;
  onSave: (d: Dienst) => void;
  onCancel: () => void;
}) {
  const [naam, setNaam] = useState(dienst.naam);
  const [prijs, setPrijs] = useState(String(dienst.prijs));
  const [beschrijving, setBeschrijving] = useState(dienst.beschrijving);

  return (
    <div style={{
      background: "#FBF7F0", border: "0.5px solid #E5DDD0",
      borderRadius: 14, padding: 16, marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontFamily: SERIF, fontSize: 17, margin: 0, color: "#1A1D1A" }}>Bewerken</p>
        <button className="touch-scale" onClick={onCancel}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8A83" }}>
          <X size={16} />
        </button>
      </div>

      <input
        value={naam}
        onChange={e => setNaam(e.target.value)}
        placeholder="Naam"
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          border: "0.5px solid #E5DDD0", background: "#F5EFE5",
          fontSize: 14, color: "#1A1D1A", marginBottom: 8,
          fontFamily: "'Inter', sans-serif",
        }}
      />
      <input
        value={prijs}
        onChange={e => setPrijs(e.target.value)}
        placeholder="Prijs"
        type="number"
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          border: "0.5px solid #E5DDD0", background: "#F5EFE5",
          fontSize: 14, color: "#1A1D1A", marginBottom: 8,
          fontFamily: "'Inter', sans-serif",
        }}
      />
      <textarea
        value={beschrijving}
        onChange={e => setBeschrijving(e.target.value)}
        placeholder="Omschrijving"
        rows={2}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 8,
          border: "0.5px solid #E5DDD0", background: "#F5EFE5",
          fontSize: 13, color: "#5C5C56", marginBottom: 12,
          resize: "none", fontFamily: "'Inter', sans-serif",
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="touch-scale" onClick={onCancel} style={{
          flex: 1, padding: "10px", fontSize: 13,
          background: "transparent", color: "#5C5C56",
          border: "0.5px solid #E5DDD0", borderRadius: 10, cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
        }}>Annuleren</button>
        <button className="touch-scale"
          onClick={() => onSave({ ...dienst, naam, prijs: Number(prijs), beschrijving })}
          style={{
            flex: 2, padding: "10px", fontSize: 13, fontWeight: 500,
            background: "#2B4030", color: "#F5EFE5",
            border: "none", borderRadius: 10, cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}>
          <Check size={13} style={{ display: "inline", marginRight: 4 }} />
          Opslaan
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function DienstenPage() {
  const [diensten, setDiensten] = useState<Dienst[]>(MOCK_DIENSTEN);
  const [editId, setEditId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setDiensten(ds => ds.map(d => d.id === id ? { ...d, actief: !d.actief } : d));
  const save = (updated: Dienst) => {
    setDiensten(ds => ds.map(d => d.id === updated.id ? updated : d));
    setEditId(null);
  };

  const actief = diensten.filter(d => d.actief);
  const gemPrijs = actief.length
    ? Math.round(actief.reduce((t, d) => t + d.prijs, 0) / actief.length)
    : 0;
  const gemDuur = actief.length
    ? duurLabel(Math.round(actief.reduce((t, d) => t + d.duurMinuten, 0) / actief.length))
    : "—";

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>
              Wat ik aanbied
            </p>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>
              Mijn diensten
            </h2>
          </div>
          <button className="touch-scale" style={{
            padding: "8px 12px", background: "#2B4030", color: "#F5EFE5",
            border: "none", borderRadius: 99, fontSize: 12, fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            fontFamily: "'Inter', sans-serif",
          }}>
            <Plus size={12} /> Nieuw
          </button>
        </div>
      </div>

      <div className="px-5 pb-28">

        {/* Stats row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          paddingTop: 16, paddingBottom: 16, marginBottom: 20,
          borderTop: "0.5px solid #E5DDD0", borderBottom: "0.5px solid #E5DDD0",
        }}>
          <div style={{ textAlign: "center", borderRight: "0.5px solid #E5DDD0" }}>
            <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#1A1D1A" }}>{actief.length}</p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Actief</p>
          </div>
          <div style={{ textAlign: "center", borderRight: "0.5px solid #E5DDD0" }}>
            <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#2B4030" }}>€{gemPrijs}</p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Gem. prijs</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#1A1D1A" }}>{gemDuur}</p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>Gem. duur</p>
          </div>
        </div>

        {/* Service cards */}
        {diensten.map(d =>
          editId === d.id
            ? <EditForm key={d.id} dienst={d} onSave={save} onCancel={() => setEditId(null)} />
            : <DienstKaart
                key={d.id}
                dienst={d}
                onToggle={() => toggle(d.id)}
                onEdit={() => setEditId(d.id)}
              />
        )}

        {/* Footer hint */}
        {diensten.length > 3 && (
          <p style={{
            fontFamily: SERIF, fontStyle: "italic", fontSize: 12,
            color: "#8A8A83", marginTop: 16, textAlign: "center",
          }}>
            + {diensten.length - 3} actieve diensten
          </p>
        )}
      </div>
    </div>
  );
}
