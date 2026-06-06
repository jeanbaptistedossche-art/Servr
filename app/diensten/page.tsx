"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, X, Check } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, type Dienst } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

function duurLabel(min: number) {
  if (min === 0) return "Op maat";
  const u = Math.floor(min / 60), m = min % 60;
  return u > 0 ? `${u}u${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 32, height: 18, background: on ? "#2B4030" : "#D3D1C7",
      borderRadius: 99, position: "relative", border: "none", cursor: "pointer", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 2,
        left: on ? "calc(100% - 16px)" : 2,
        width: 14, height: 14, background: "#F5EFE5",
        borderRadius: "50%", transition: "left 0.15s",
      }} />
    </button>
  );
}

function DienstKaart({ dienst, onToggle, onEdit }: { dienst: Dienst; onToggle: () => void; onEdit: () => void }) {
  const prijs = Math.round(dienst.prijs / 100); // centen → euros
  const priceLabel = dienst.eenheid === "vast bedrag" ? `€${prijs}` : `€${prijs}/${dienst.eenheid === "per uur" ? "u" : dienst.eenheid}`;
  const metaLabel = [
    `${duurLabel(dienst.duur_minuten)}${dienst.buffer_minuten > 0 ? ` + ${duurLabel(dienst.buffer_minuten)} buffer` : ""}`,
    dienst.btw ? `BTW ${dienst.btw_percentage}%` : null,
  ].filter(Boolean).join("  ·  ");

  return (
    <div style={{
      background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, marginBottom: 10,
      opacity: dienst.actief ? 1 : 0.65, transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <p style={{ fontFamily: SERIF, fontSize: 17, margin: 0, color: "#1A1D1A" }}>{dienst.naam}</p>
        <Toggle on={dienst.actief} onToggle={onToggle} />
      </div>
      {dienst.beschrijving && (
        <p style={{ fontSize: 12, color: "#8A8A83", margin: "0 0 12px" }}>{dienst.beschrijving}</p>
      )}
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", paddingTop: 12, borderTop: "0.5px solid #E5DDD0" }}>
        <span style={{ fontFamily: SERIF, fontSize: 15, color: dienst.actief ? "#2B4030" : "#8A8A83" }}>{priceLabel}</span>
        <span style={{ fontSize: 11, color: "#8A8A83", flex: 1 }}>{metaLabel}</span>
        <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Pencil size={15} style={{ color: dienst.actief ? "#1A1D1A" : "#8A8A83" }} />
        </button>
      </div>
    </div>
  );
}

function EditForm({ dienst, onSave, onCancel }: { dienst: Dienst; onSave: (d: Partial<Dienst>) => void; onCancel: () => void }) {
  const [naam, setNaam] = useState(dienst.naam);
  const [prijs, setPrijs] = useState(String(Math.round(dienst.prijs / 100)));
  const [beschrijving, setBeschrijving] = useState(dienst.beschrijving ?? "");

  return (
    <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontFamily: SERIF, fontSize: 17, margin: 0 }}>Bewerken</p>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8A83" }}>
          <X size={16} />
        </button>
      </div>
      {[
        { val: naam, set: setNaam, ph: "Naam", type: "text" },
        { val: prijs, set: setPrijs, ph: "Prijs (€)", type: "number" },
      ].map(f => (
        <input key={f.ph} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} type={f.type}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #E5DDD0", background: "#F5EFE5", fontSize: 14, color: "#1A1D1A", marginBottom: 8, fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
      ))}
      <textarea value={beschrijving} onChange={e => setBeschrijving(e.target.value)} placeholder="Omschrijving" rows={2}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #E5DDD0", background: "#F5EFE5", fontSize: 13, color: "#5C5C56", marginBottom: 12, resize: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 10, fontSize: 13, background: "transparent", color: "#5C5C56", border: "0.5px solid #E5DDD0", borderRadius: 10, cursor: "pointer" }}>Annuleren</button>
        <button onClick={() => onSave({ naam, prijs: Number(prijs) * 100, beschrijving })}
          style={{ flex: 2, padding: 10, fontSize: 13, fontWeight: 500, background: "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 10, cursor: "pointer" }}>
          <Check size={13} style={{ display: "inline", marginRight: 4 }} /> Opslaan
        </button>
      </div>
    </div>
  );
}

const EENHEDEN = [
  { value: "per uur",     label: "Per uur",       short: "/u" },
  { value: "per minuut",  label: "Per minuut",     short: "/min" },
  { value: "per dag",     label: "Per dag",        short: "/dag" },
  { value: "per eenheid", label: "Per eenheid",    short: "/st" },
  { value: "per m²",      label: "Per m²",         short: "/m²" },
  { value: "per m",       label: "Per meter",      short: "/m" },
  { value: "per cm",      label: "Per centimeter", short: "/cm" },
  { value: "vast bedrag", label: "Vast bedrag",    short: "vast" },
];

const BUFFER_OPTIES = [
  { value: 0,  label: "Geen buffer" },
  { value: 5,  label: "5 minuten" },
  { value: 10, label: "10 minuten" },
  { value: 15, label: "15 minuten" },
  { value: 20, label: "20 minuten" },
  { value: 30, label: "30 minuten" },
  { value: 45, label: "45 minuten" },
  { value: 60, label: "1 uur" },
];

const DUUR_OPTIES = [
  { value: 0,   label: "Afhankelijk van de bestelling" },
  { value: 15,  label: "15 min" },
  { value: 30,  label: "30 min" },
  { value: 45,  label: "45 min" },
  { value: 60,  label: "1 uur" },
  { value: 90,  label: "1u 30m" },
  { value: 120, label: "2 uur" },
  { value: 180, label: "3 uur" },
  { value: 240, label: "4 uur" },
  { value: 480, label: "Hele dag" },
];

const INPUT = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #E5DDD0", background: "#F5EFE5", fontSize: 14, color: "#1A1D1A", marginBottom: 8, fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const };
const SELECT = { ...INPUT, appearance: "none" as const, cursor: "pointer" };
const LABEL = { fontSize: 11, color: "#8A8A83", marginBottom: 4, display: "block" as const };

function NieuwForm({ vakmanId, onSaved, onCancel }: { vakmanId: string; onSaved: () => void; onCancel: () => void }) {
  const [naam, setNaam] = useState("");
  const [prijs, setPrijs] = useState("");
  const [eenheid, setEenheid] = useState("per uur");
  const [duur, setDuur] = useState(0);
  const [buffer, setBuffer] = useState(15);
  const [beschrijving, setBeschrijving] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!naam || !prijs) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("diensten") as any).insert({
      vakman_id: vakmanId,
      naam,
      prijs: Number(prijs) * 100,
      beschrijving: beschrijving || null,
      eenheid,
      duur_minuten: duur,
      buffer_minuten: buffer,
      btw: true,
      btw_percentage: 21,
      actief: true,
    });
    setLoading(false);
    onSaved();
  };

  const kanOpslaan = naam && prijs && !loading;

  return (
    <div style={{ background: "#FBF7F0", border: "0.5px solid #2B4030", borderRadius: 14, padding: 16, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontFamily: SERIF, fontSize: 17, margin: 0 }}>Nieuwe dienst</p>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8A83" }}><X size={16} /></button>
      </div>

      {/* Naam */}
      <label style={LABEL}>Naam dienst</label>
      <input value={naam} onChange={e => setNaam(e.target.value)} placeholder="bv. Loodgieterswerk, Schilderen…" type="text" style={INPUT} />

      {/* Prijs + eenheid naast elkaar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 0 }}>
        <div>
          <label style={LABEL}>Prijs (€)</label>
          <input value={prijs} onChange={e => setPrijs(e.target.value)} placeholder="0" type="number" min="0" style={{ ...INPUT, marginBottom: 0 }} />
        </div>
        <div>
          <label style={LABEL}>Eenheid</label>
          <select value={eenheid} onChange={e => setEenheid(e.target.value)} style={{ ...SELECT, marginBottom: 0 }}>
            {EENHEDEN.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Duur + buffer naast elkaar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, marginBottom: 8 }}>
        <div>
          <label style={LABEL}>Geschatte duur</label>
          <select value={duur} onChange={e => setDuur(Number(e.target.value))} style={{ ...SELECT, marginBottom: 0 }}>
            {DUUR_OPTIES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL}>Buffer na afspraak</label>
          <select value={buffer} onChange={e => setBuffer(Number(e.target.value))} style={{ ...SELECT, marginBottom: 0 }}>
            {BUFFER_OPTIES.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Omschrijving */}
      <label style={LABEL}>Omschrijving (optioneel)</label>
      <textarea value={beschrijving} onChange={e => setBeschrijving(e.target.value)} placeholder="Wat houdt deze dienst in?" rows={2}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #E5DDD0", background: "#F5EFE5", fontSize: 13, color: "#5C5C56", marginBottom: 12, resize: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />

      <button onClick={save} disabled={!kanOpslaan}
        style={{ width: "100%", padding: 11, fontSize: 13, fontWeight: 500, background: kanOpslaan ? "#2B4030" : "#E5DDD0", color: kanOpslaan ? "#F5EFE5" : "#8A8A83", border: "none", borderRadius: 10, cursor: kanOpslaan ? "pointer" : "default" }}>
        {loading ? "Opslaan…" : "Dienst toevoegen"}
      </button>
    </div>
  );
}

export default function DienstenPage() {
  const { userId } = useUserStore();
  const [diensten, setDiensten] = useState<Dienst[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showNieuw, setShowNieuw] = useState(false);
  const [loading, setLoading] = useState(true);

  const laadDiensten = async () => {
    if (!userId) return;
    setLoading(true);
    if (supabaseReady) {
      const { data } = await supabase.from("diensten").select("*").eq("vakman_id", userId).order("actief", { ascending: false });
      setDiensten((data as Dienst[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { laadDiensten(); }, [userId]);

  const toggle = async (d: Dienst) => {
    setDiensten(ds => ds.map(x => x.id === d.id ? { ...x, actief: !x.actief } : x));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (supabaseReady) await (supabase.from("diensten") as any).update({ actief: !d.actief }).eq("id", d.id);
  };

  const save = async (id: string, updates: Partial<Dienst>) => {
    setDiensten(ds => ds.map(x => x.id === id ? { ...x, ...updates } : x));
    setEditId(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (supabaseReady) await (supabase.from("diensten") as any).update(updates).eq("id", id);
  };

  const actief = diensten.filter(d => d.actief);
  const gemPrijs = actief.length ? Math.round(actief.reduce((t, d) => t + d.prijs, 0) / actief.length / 100) : 0;
  const gemDuur = actief.length ? duurLabel(Math.round(actief.reduce((t, d) => t + d.duur_minuten, 0) / actief.length)) : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>Wat ik aanbied</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>Mijn diensten</h2>
          </div>
          <button onClick={() => setShowNieuw(true)} style={{
            padding: "8px 12px", background: "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 99,
            fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          }}>
            <Plus size={12} /> Nieuw
          </button>
        </div>
      </div>

      <div className="px-5 pb-28">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", paddingTop: 16, paddingBottom: 16, marginBottom: 20, borderTop: "0.5px solid #E5DDD0", borderBottom: "0.5px solid #E5DDD0" }}>
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

        {showNieuw && userId && (
          <NieuwForm vakmanId={userId} onSaved={() => { setShowNieuw(false); laadDiensten(); }} onCancel={() => setShowNieuw(false)} />
        )}

        {loading ? (
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#8A8A83", textAlign: "center", paddingTop: 32 }}>Laden…</p>
        ) : diensten.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: "#1A1D1A", margin: "0 0 8px" }}>Nog geen diensten</p>
            <p style={{ fontSize: 13, color: "#8A8A83" }}>Klik op "+ Nieuw" om je eerste dienst toe te voegen.</p>
          </div>
        ) : (
          diensten.map(d =>
            editId === d.id
              ? <EditForm key={d.id} dienst={d} onSave={u => save(d.id, u)} onCancel={() => setEditId(null)} />
              : <DienstKaart key={d.id} dienst={d} onToggle={() => toggle(d)} onEdit={() => setEditId(d.id)} />
          )
        )}
      </div>
    </div>
  );
}
