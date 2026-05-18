"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Clock, Euro, Edit3, Trash2, ToggleLeft, ToggleRight, ChevronDown, Check } from "lucide-react";
import { MOCK_DIENSTEN, type Dienst } from "@/lib/bedrijfStore";

const EENHEDEN: Dienst["eenheid"][] = ["per uur", "per dag", "vast bedrag", "per m²", "per stuk"];
const CATEGORIEEN = ["Loodgieter", "Elektricien", "Schilder", "Schoonmaak", "Timmerman", "HVAC", "Slotenmaker", "Overig"];

function DienstKaart({ dienst, onEdit, onDelete, onToggle }: {
  dienst: Dienst;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const uren = Math.floor(dienst.duurMinuten / 60);
  const minuten = dienst.duurMinuten % 60;
  const duurLabel = uren > 0
    ? `${uren}u${minuten > 0 ? ` ${minuten}m` : ""}`
    : `${minuten}m`;

  return (
    <div className={`card p-4 transition-opacity ${!dienst.actief ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm">{dienst.naam}</p>
            {!dienst.actief && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                Inactief
              </span>
            )}
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>
            {dienst.beschrijving}
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
              <Euro size={11} />
              {dienst.prijs} {dienst.eenheid}
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
              <Clock size={11} /> {duurLabel}
            </div>
            {dienst.bufferMinuten > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#fef3c7", color: "#d97706" }}>
                +{dienst.bufferMinuten}m buffer
              </div>
            )}
          </div>
        </div>

        {/* Acties */}
        <div className="flex flex-col gap-2">
          <button onClick={onToggle} className="touch-scale">
            {dienst.actief
              ? <ToggleRight size={28} style={{ color: "var(--teal)" }} />
              : <ToggleLeft size={28} style={{ color: "var(--muted)" }} />}
          </button>
          <button onClick={onEdit}
            className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <Edit3 size={14} style={{ color: "var(--muted)" }} />
          </button>
          <button onClick={onDelete}
            className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#fee2e220" }}>
            <Trash2 size={14} style={{ color: "#dc2626" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DienstForm({ dienst, onSave, onCancel }: {
  dienst: Partial<Dienst>;
  onSave: (d: Dienst) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Dienst>>({
    naam: "", beschrijving: "", prijs: 0, eenheid: "per uur",
    duurMinuten: 60, bufferMinuten: 15, categorie: "Loodgieter",
    actief: true, btw: true, ...dienst,
  });

  const up = (k: keyof Dienst) => (v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const isValid = form.naam && form.prijs && form.prijs > 0;

  return (
    <div className="card p-5 flex flex-col gap-4 animate-slide-up">
      <p className="font-black text-base">{dienst.id ? "Dienst bewerken" : "Nieuwe dienst"}</p>

      <div>
        <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Naam *</label>
        <input value={form.naam || ""} onChange={e => up("naam")(e.target.value)}
          placeholder="bijv. Lekkage reparatie"
          className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
          style={{ borderColor: form.naam ? "var(--teal)" : "var(--border)", background: "var(--surface)" }} />
      </div>

      <div>
        <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Beschrijving</label>
        <textarea value={form.beschrijving || ""} onChange={e => up("beschrijving")(e.target.value)}
          placeholder="Wat is er inbegrepen bij deze dienst?"
          rows={2} className="w-full px-4 py-3 rounded-2xl border outline-none text-sm resize-none"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
      </div>

      {/* Prijs + eenheid */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Prijs (€) *</label>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border"
            style={{ borderColor: form.prijs ? "var(--teal)" : "var(--border)", background: "var(--surface)" }}>
            <Euro size={14} style={{ color: "var(--teal)" }} />
            <input type="number" value={form.prijs || ""} onChange={e => up("prijs")(+e.target.value)}
              className="flex-1 bg-transparent outline-none text-base font-black"
              style={{ color: "var(--teal)" }} inputMode="decimal" />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Eenheid</label>
          <select value={form.eenheid} onChange={e => up("eenheid")(e.target.value as Dienst["eenheid"])}
            className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}>
            {EENHEDEN.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Duur + buffer */}
      <div>
        <label className="text-xs font-bold uppercase mb-2 block" style={{ color: "var(--muted)" }}>
          Geschatte duur
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[30, 60, 90, 120, 180, 240, 360, 480].map(m => {
            const l = m < 60 ? `${m}m` : m % 60 === 0 ? `${m / 60}u` : `${Math.floor(m / 60)}u${m % 60}m`;
            return (
              <button key={m} onClick={() => up("duurMinuten")(m)}
                className="touch-scale py-2.5 rounded-xl text-xs font-semibold border-2 transition-all"
                style={{
                  borderColor: form.duurMinuten === m ? "var(--teal)" : "var(--border)",
                  background: form.duurMinuten === m ? "var(--teal)" + "10" : "var(--surface)",
                  color: form.duurMinuten === m ? "var(--teal)" : "var(--foreground)",
                }}>
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase mb-2 block" style={{ color: "var(--muted)" }}>
          Reistijd / buffer erna
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[0, 15, 20, 30, 45].map(m => (
            <button key={m} onClick={() => up("bufferMinuten")(m)}
              className="touch-scale py-2.5 rounded-xl text-xs font-semibold border-2 transition-all"
              style={{
                borderColor: form.bufferMinuten === m ? "#d97706" : "var(--border)",
                background: form.bufferMinuten === m ? "#fef3c7" : "var(--surface)",
                color: form.bufferMinuten === m ? "#d97706" : "var(--foreground)",
              }}>
              {m === 0 ? "Geen" : `${m}m`}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Na deze taak wordt {form.bufferMinuten}m gereserveerd voor reistijd. Totale blokkering: <strong>{(form.duurMinuten || 0) + (form.bufferMinuten || 0)}m</strong>
        </p>
      </div>

      {/* Categorie */}
      <div>
        <label className="text-xs font-bold uppercase mb-2 block" style={{ color: "var(--muted)" }}>Categorie</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIEEN.map(c => (
            <button key={c} onClick={() => up("categorie")(c)}
              className="touch-scale px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
              style={{
                borderColor: form.categorie === c ? "var(--teal)" : "var(--border)",
                background: form.categorie === c ? "var(--teal)" + "10" : "transparent",
                color: form.categorie === c ? "var(--teal)" : "var(--muted)",
              }}>
              {form.categorie === c && "✓ "}{c}
            </button>
          ))}
        </div>
      </div>

      {/* BTW */}
      <button onClick={() => up("btw")(!form.btw)}
        className="touch-scale flex items-center gap-3 px-4 py-3 rounded-2xl border"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all"
          style={{ borderColor: form.btw ? "var(--teal)" : "var(--border)", background: form.btw ? "var(--teal)" : "transparent" }}>
          {form.btw && <Check size={12} color="white" />}
        </div>
        <span className="text-sm font-medium">BTW (21%) toepassen</span>
      </button>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel}
          className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm border"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Annuleren
        </button>
        <button
          onClick={() => isValid && onSave(form as Dienst)}
          className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: isValid ? "var(--teal)" : "var(--muted)" }}>
          Opslaan
        </button>
      </div>
    </div>
  );
}

export default function DienstenPage() {
  const [diensten, setDiensten] = useState<Dienst[]>(MOCK_DIENSTEN);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const toggle = (id: string) => setDiensten(ds => ds.map(d => d.id === id ? { ...d, actief: !d.actief } : d));
  const verwijder = (id: string) => setDiensten(ds => ds.filter(d => d.id !== id));
  const slaOp = (dienst: Dienst) => {
    if (editId) {
      setDiensten(ds => ds.map(d => d.id === editId ? { ...dienst, id: editId } : d));
      setEditId(null);
    } else {
      setDiensten(ds => [...ds, { ...dienst, id: `d${Date.now()}` }]);
      setShowForm(false);
    }
  };

  const actief = diensten.filter(d => d.actief);
  const inactief = diensten.filter(d => !d.actief);

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard"
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-xl">Mijn diensten</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{actief.length} actief · {inactief.length} inactief</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); }}
          className="touch-scale flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: "var(--teal)" }}>
          <Plus size={16} /> Nieuw
        </button>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">
        {/* Uitleg */}
        <div className="p-4 rounded-2xl" style={{ background: "var(--teal)" + "10" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--teal)" }}>
            💡 <strong>Duur & buffer zijn belangrijk voor je agenda.</strong> Als een taak 90 min duurt + 20 min reistijd, blokkeert het systeem 110 min. Zo kom je nooit te laat op de volgende klant.
          </p>
        </div>

        {/* Nieuw formulier */}
        {showForm && !editId && (
          <DienstForm
            dienst={{}}
            onSave={slaOp}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Actieve diensten */}
        {actief.length > 0 && (
          <div>
            <p className="font-black text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Actief ({actief.length})
            </p>
            <div className="flex flex-col gap-3">
              {actief.map(d => editId === d.id
                ? <DienstForm key={d.id} dienst={d} onSave={slaOp} onCancel={() => setEditId(null)} />
                : <DienstKaart key={d.id} dienst={d}
                    onEdit={() => setEditId(d.id)}
                    onDelete={() => verwijder(d.id)}
                    onToggle={() => toggle(d.id)} />
              )}
            </div>
          </div>
        )}

        {/* Inactieve diensten */}
        {inactief.length > 0 && (
          <div>
            <p className="font-black text-sm mb-3 flex items-center gap-2" style={{ color: "var(--muted)" }}>
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Inactief ({inactief.length})
            </p>
            <div className="flex flex-col gap-3">
              {inactief.map(d => (
                <DienstKaart key={d.id} dienst={d}
                  onEdit={() => setEditId(d.id)}
                  onDelete={() => verwijder(d.id)}
                  onToggle={() => toggle(d.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
