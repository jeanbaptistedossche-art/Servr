"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Clock, Euro, Edit3, Trash2,
  Check, ToggleLeft, ToggleRight, X, ChevronRight,
  Wrench, Coffee, Package,
} from "lucide-react";
import { MOCK_DIENSTEN, type Dienst } from "@/lib/bedrijfStore";

const EENHEDEN: Dienst["eenheid"][] = ["per uur", "per dag", "vast bedrag", "per m²", "per stuk"];
const CATEGORIEEN = ["Loodgieter", "Elektricien", "Schilder", "Schoonmaak", "Timmerman", "HVAC", "Slotenmaker", "Overig"];

function duurLabel(min: number) {
  const u = Math.floor(min / 60), m = min % 60;
  return u > 0 ? `${u}u${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

/* ── Service card ─────────────────────────────────────────────────────────── */
function DienstKaart({ dienst, onEdit, onDelete, onToggle }: {
  dienst: Dienst; onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
      opacity: dienst.actief ? 1 : 0.55,
      transition: "opacity 0.2s",
    }}>
      {/* Color accent */}
      <div style={{
        height: 4,
        borderRadius: "22px 22px 0 0",
        background: dienst.actief
          ? "linear-gradient(90deg, #4F46E5, #818CF8)"
          : "linear-gradient(90deg, #cbd5e1, #e2e8f0)",
      }} />

      <div className="p-4">
        {/* Top row: name + toggle */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-black text-base leading-tight" style={{ color: "#0f172a" }}>{dienst.naam}</p>
              {!dienst.actief && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "#F1F5F9", color: "#94a3b8" }}>Inactief</span>
              )}
            </div>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "#64748b" }}>{dienst.beschrijving}</p>
          </div>
          {/* Toggle */}
          <button onClick={onToggle} className="touch-scale flex-shrink-0 mt-0.5">
            <div className="relative w-12 h-6 rounded-full transition-all"
              style={{ background: dienst.actief ? "#4F46E5" : "#e2e8f0" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                style={{ left: dienst.actief ? "calc(100% - 22px)" : "2px", transition: "left 0.2s" }} />
            </div>
          </button>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-2 my-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
            style={{ background: "#EEF2FF", color: "#4F46E5" }}>
            <Euro size={11} /> {dienst.prijs} {dienst.eenheid}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "#F8FAFC", color: "#64748b" }}>
            <Clock size={11} /> {duurLabel(dienst.duurMinuten)}
          </span>
          {dienst.bufferMinuten > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "#FFFBEB", color: "#D97706" }}>
              <Coffee size={11} /> +{dienst.bufferMinuten}m buffer
            </span>
          )}
          {dienst.btw && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "#F0FDF4", color: "#16A34A" }}>
              BTW 21%
            </span>
          )}
        </div>

        {/* Actions */}
        {confirmDelete ? (
          <div className="flex items-center gap-2 mt-1 p-3 rounded-2xl"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <p className="flex-1 text-xs font-semibold" style={{ color: "#DC2626" }}>
              Weet je het zeker?
            </p>
            <button onClick={() => setConfirmDelete(false)}
              className="touch-scale px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: "#fff", color: "#64748b" }}>
              Nee
            </button>
            <button onClick={onDelete}
              className="touch-scale px-3 py-1.5 rounded-xl text-xs font-bold text-white"
              style={{ background: "#DC2626" }}>
              Verwijder
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <button onClick={onEdit}
              className="touch-scale flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: "#EEF2FF", color: "#4F46E5" }}>
              <Edit3 size={13} /> Bewerken
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="touch-scale w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#FEF2F2" }}>
              <Trash2 size={15} style={{ color: "#EF4444" }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Service form ─────────────────────────────────────────────────────────── */
function DienstForm({ dienst, onSave, onCancel }: {
  dienst: Partial<Dienst>; onSave: (d: Dienst) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Dienst>>({
    naam: "", beschrijving: "", prijs: 0, eenheid: "per uur",
    duurMinuten: 60, bufferMinuten: 15, categorie: "Loodgieter",
    actief: true, btw: true, ...dienst,
  });

  const up = <K extends keyof Dienst>(k: K) => (v: Dienst[K]) => setForm(f => ({ ...f, [k]: v }));
  const isValid = !!(form.naam?.trim() && form.prijs && form.prijs > 0);

  return (
    <div style={{
      background: "#fff", borderRadius: 24,
      boxShadow: "0 8px 40px rgba(79,70,229,0.15)",
      border: "2px solid #EEF2FF",
    }}>
      {/* Form header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div>
          <p className="font-black text-base" style={{ color: "#0f172a" }}>
            {dienst.id ? "Dienst bewerken" : "Nieuwe dienst"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Vul alle verplichte velden in</p>
        </div>
        <button onClick={onCancel} className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ background: "#F1F5F9" }}>
          <X size={16} style={{ color: "#64748b" }} />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">

        {/* Naam */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
            Naam *
          </label>
          <input value={form.naam || ""} onChange={e => up("naam")(e.target.value)}
            placeholder="bijv. Lekkage repareren"
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 14, outline: "none",
              fontSize: 15, fontWeight: 600, color: "#0f172a",
              border: `2px solid ${form.naam ? "#4F46E5" : "#E5E7EB"}`,
              background: form.naam ? "#F8F8FF" : "#FAFAFA",
              boxSizing: "border-box",
              boxShadow: form.naam ? "0 0 0 4px rgba(79,70,229,0.08)" : "none",
            }} />
        </div>

        {/* Beschrijving */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
            Beschrijving
          </label>
          <textarea value={form.beschrijving || ""} onChange={e => up("beschrijving")(e.target.value)}
            placeholder="Wat is inbegrepen bij deze dienst?"
            rows={2}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 14, outline: "none",
              fontSize: 14, color: "#0f172a", resize: "none",
              border: "2px solid #E5E7EB", background: "#FAFAFA", boxSizing: "border-box",
            }} />
        </div>

        {/* Prijs + eenheid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
              Prijs (€) *
            </label>
            <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
              style={{
                border: `2px solid ${form.prijs ? "#4F46E5" : "#E5E7EB"}`,
                background: form.prijs ? "#F8F8FF" : "#FAFAFA",
              }}>
              <span className="font-black" style={{ color: "#4F46E5", fontSize: 16 }}>€</span>
              <input type="number" value={form.prijs || ""} onChange={e => up("prijs")(+e.target.value)}
                className="flex-1 bg-transparent outline-none font-black"
                style={{ color: "#0f172a", fontSize: 18 }} inputMode="decimal" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
              Eenheid
            </label>
            <select value={form.eenheid} onChange={e => up("eenheid")(e.target.value as Dienst["eenheid"])}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 14, outline: "none",
                fontSize: 13, fontWeight: 600, color: "#0f172a",
                border: "2px solid #E5E7EB", background: "#FAFAFA", appearance: "none",
              }}>
              {EENHEDEN.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* Duur */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>
            Geschatte duur
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[30, 60, 90, 120, 180, 240, 360, 480].map(m => {
              const l = m < 60 ? `${m}m` : m % 60 === 0 ? `${m / 60}u` : `${Math.floor(m / 60)}u${m % 60}m`;
              const active = form.duurMinuten === m;
              return (
                <button key={m} onClick={() => up("duurMinuten")(m)}
                  className="touch-scale py-3 rounded-2xl text-xs font-bold transition-all"
                  style={{
                    background: active ? "#4F46E5" : "#F1F5F9",
                    color: active ? "white" : "#64748b",
                    boxShadow: active ? "0 4px 12px rgba(79,70,229,0.35)" : "none",
                  }}>
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buffer */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#94a3b8" }}>
            Reistijd / buffer erna
          </label>
          <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
            Blokkeerttijd na de klus: <strong style={{ color: "#0f172a" }}>{(form.duurMinuten || 0) + (form.bufferMinuten || 0)} min totaal</strong>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[0, 15, 20, 30, 45].map(m => {
              const active = form.bufferMinuten === m;
              return (
                <button key={m} onClick={() => up("bufferMinuten")(m)}
                  className="touch-scale py-3 rounded-2xl text-xs font-bold transition-all"
                  style={{
                    background: active ? "#D97706" : "#F1F5F9",
                    color: active ? "white" : "#64748b",
                    boxShadow: active ? "0 4px 12px rgba(217,119,6,0.35)" : "none",
                  }}>
                  {m === 0 ? "Geen" : `+${m}m`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categorie */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-2.5" style={{ color: "#94a3b8" }}>
            Categorie
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIEEN.map(c => {
              const active = form.categorie === c;
              return (
                <button key={c} onClick={() => up("categorie")(c)}
                  className="touch-scale flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: active ? "#4F46E5" : "#F1F5F9",
                    color: active ? "white" : "#64748b",
                    boxShadow: active ? "0 3px 10px rgba(79,70,229,0.35)" : "none",
                  }}>
                  {active && <Check size={11} />} {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* BTW toggle */}
        <button onClick={() => up("btw")(!form.btw)}
          className="touch-scale flex items-center gap-4 px-4 py-4 rounded-2xl"
          style={{ background: form.btw ? "#F0FDF4" : "#F8FAFC", border: `2px solid ${form.btw ? "#BBF7D0" : "#E5E7EB"}` }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all flex-shrink-0"
            style={{ borderColor: form.btw ? "#16A34A" : "#E5E7EB", background: form.btw ? "#16A34A" : "white" }}>
            {form.btw && <Check size={13} color="white" strokeWidth={3} />}
          </div>
          <div className="text-left">
            <p className="font-bold text-sm" style={{ color: "#0f172a" }}>BTW 21% toepassen</p>
            {form.btw && form.prijs ? (
              <p className="text-xs mt-0.5" style={{ color: "#16A34A" }}>
                Incl. BTW: € {(form.prijs * 1.21).toFixed(2)}
              </p>
            ) : (
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Prijs exclusief BTW</p>
            )}
          </div>
        </button>

        {/* Save / Cancel */}
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel}
            className="touch-scale flex-1 py-4 rounded-2xl font-bold text-sm"
            style={{ background: "#F1F5F9", color: "#64748b" }}>
            Annuleren
          </button>
          <button onClick={() => isValid && onSave(form as Dienst)}
            disabled={!isValid}
            className="touch-scale flex-1 py-4 rounded-2xl font-black text-white text-sm"
            style={{
              background: isValid ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "#E2E8F0",
              color: isValid ? "white" : "#94a3b8",
              boxShadow: isValid ? "0 6px 20px rgba(79,70,229,0.4)" : "none",
            }}>
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
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
    <div className="flex flex-col min-h-full pb-10 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 pt-14 pb-4"
        style={{ background: "rgba(241,244,250,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3 px-5">
          <Link href="/profile"
            className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
            <ArrowLeft size={18} style={{ color: "#475569" }} />
          </Link>
          <div className="flex-1">
            <h1 className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>Mijn diensten</h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: "#94a3b8" }}>
              {actief.length} actief · {inactief.length} inactief
            </p>
          </div>
          {!showForm && editId === null && (
            <button onClick={() => setShowForm(true)}
              className="touch-scale flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-white text-sm"
              style={{
                background: "linear-gradient(135deg, #4F46E5, #818CF8)",
                boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
              }}>
              <Plus size={16} /> Nieuw
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: String(actief.length), l: "Actieve diensten", color: "#4F46E5", bg: "#EEF2FF" },
            { v: `€${actief.reduce((t, d) => t + d.prijs, 0) / Math.max(actief.length, 1) | 0}`, l: "Gem. prijs", color: "#10B981", bg: "#ECFDF5" },
            { v: `${actief.reduce((t, d) => t + d.duurMinuten, 0) / 60 / Math.max(actief.length, 1) | 0}u`, l: "Gem. duur", color: "#F59E0B", bg: "#FFFBEB" },
          ].map(s => (
            <div key={s.l} className="flex flex-col items-center py-3.5 rounded-2xl"
              style={{ background: s.bg }}>
              <span className="font-black text-xl leading-none" style={{ color: s.color }}>{s.v}</span>
              <span className="text-[10px] mt-1 font-semibold text-center leading-tight" style={{ color: s.color + "99" }}>
                {s.l}
              </span>
            </div>
          ))}
        </div>

        {/* Tip card */}
        <div className="flex items-start gap-3 px-4 py-4 rounded-2xl"
          style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#4F46E5" }}>
            <Wrench size={15} color="white" />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#3730A3" }}>
            <strong>Tip:</strong> Stel duur + buffer correct in — zo blokkeert het systeem de juiste tijd voor de volgende boeking.
          </p>
        </div>

        {/* New form */}
        {showForm && !editId && (
          <DienstForm dienst={{}} onSave={slaOp} onCancel={() => setShowForm(false)} />
        )}

        {/* Active services */}
        {actief.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <p className="font-black text-sm" style={{ color: "#0f172a" }}>Actief ({actief.length})</p>
            </div>
            <div className="flex flex-col gap-3">
              {actief.map(d => editId === d.id
                ? <DienstForm key={d.id} dienst={d} onSave={slaOp} onCancel={() => setEditId(null)} />
                : <DienstKaart key={d.id} dienst={d}
                    onEdit={() => { setShowForm(false); setEditId(d.id); }}
                    onDelete={() => verwijder(d.id)}
                    onToggle={() => toggle(d.id)} />
              )}
            </div>
          </div>
        )}

        {/* Inactive services */}
        {inactief.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <p className="font-black text-sm" style={{ color: "#94a3b8" }}>Inactief ({inactief.length})</p>
            </div>
            <div className="flex flex-col gap-3">
              {inactief.map(d => editId === d.id
                ? <DienstForm key={d.id} dienst={d} onSave={slaOp} onCancel={() => setEditId(null)} />
                : <DienstKaart key={d.id} dienst={d}
                    onEdit={() => { setShowForm(false); setEditId(d.id); }}
                    onDelete={() => verwijder(d.id)}
                    onToggle={() => toggle(d.id)} />
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {diensten.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "#EEF2FF" }}>
              <Package size={34} style={{ color: "#4F46E5" }} />
            </div>
            <div>
              <p className="font-black text-lg" style={{ color: "#0f172a" }}>Nog geen diensten</p>
              <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Voeg je eerste dienst toe om boekingen te ontvangen</p>
            </div>
            <button onClick={() => setShowForm(true)}
              className="touch-scale px-6 py-3.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 6px 20px rgba(79,70,229,0.4)" }}>
              + Dienst toevoegen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
