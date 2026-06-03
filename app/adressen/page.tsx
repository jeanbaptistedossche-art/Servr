"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Home, Briefcase, MapPin, Star, Trash2, Edit3, Check, X } from "lucide-react";

type Adres = {
  id: string;
  label: string;
  icon: "home" | "work" | "pin";
  straat: string;
  huisnr: string;
  postcode: string;
  stad: string;
  isStandaard: boolean;
};

const ICONS = {
  home: <Home size={16} />,
  work: <Briefcase size={16} />,
  pin: <MapPin size={16} />,
};

const INITIAL_ADRESSEN: Adres[] = [
  {
    id: "a1",
    label: "Thuis",
    icon: "home",
    straat: "Prinsengracht",
    huisnr: "124",
    postcode: "1015 EA",
    stad: "Amsterdam",
    isStandaard: true,
  },
  {
    id: "a2",
    label: "Werk",
    icon: "work",
    straat: "Herengracht",
    huisnr: "250",
    postcode: "1016 BV",
    stad: "Amsterdam",
    isStandaard: false,
  },
];

const ICON_OPTIONS: { value: Adres["icon"]; label: string }[] = [
  { value: "home", label: "🏠 Thuis" },
  { value: "work", label: "💼 Werk" },
  { value: "pin", label: "📍 Anders" },
];

type FormState = {
  label: string;
  icon: Adres["icon"];
  straat: string;
  huisnr: string;
  postcode: string;
  stad: string;
};

const emptyForm = (): FormState => ({
  label: "",
  icon: "pin",
  straat: "",
  huisnr: "",
  postcode: "",
  stad: "Amsterdam",
});

export default function AdressenPage() {
  const [adressen, setAdressen] = useState<Adres[]>(INITIAL_ADRESSEN);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [savedFlash, setSavedFlash] = useState(false);

  const openAdd = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (a: Adres) => {
    setForm({ label: a.label, icon: a.icon, straat: a.straat, huisnr: a.huisnr, postcode: a.postcode, stad: a.stad });
    setEditId(a.id);
    setShowForm(true);
  };

  const saveForm = () => {
    if (!form.straat || !form.postcode || !form.stad) return;
    const label = form.label.trim() || (form.icon === "home" ? "Thuis" : form.icon === "work" ? "Werk" : "Locatie");

    if (editId) {
      setAdressen(prev => prev.map(a => a.id === editId ? { ...a, ...form, label } : a));
    } else {
      const nieuw: Adres = {
        id: `a${Date.now()}`,
        label,
        icon: form.icon,
        straat: form.straat,
        huisnr: form.huisnr,
        postcode: form.postcode,
        stad: form.stad,
        isStandaard: adressen.length === 0,
      };
      setAdressen(prev => [...prev, nieuw]);
    }
    setShowForm(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const deleteAdres = (id: string) => {
    setAdressen(prev => {
      const filtered = prev.filter(a => a.id !== id);
      // Als verwijderd adres standaard was, maak eerste standaard
      if (prev.find(a => a.id === id)?.isStandaard && filtered.length > 0) {
        filtered[0].isStandaard = true;
      }
      return filtered;
    });
  };

  const setStandaard = (id: string) => {
    setAdressen(prev => prev.map(a => ({ ...a, isStandaard: a.id === id })));
  };

  const f = (field: keyof FormState, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "#F5EFE5", borderBottom: "1px solid #E5DDD0" }}>
        <Link href="/profile"
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-xl">Mijn adressen</h1>
          <p className="text-xs" style={{ color: "#8A8A83" }}>{adressen.length} opgeslagen</p>
        </div>
        <button onClick={openAdd}
          className="touch-scale flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: "#2B4030" }}>
          <Plus size={15} /> Toevoegen
        </button>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3">
        {/* Opgeslagen flash */}
        {savedFlash && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl animate-slide-up"
            style={{ background: "#dcfce7", color: "#166534" }}>
            <Check size={16} />
            <span className="text-sm font-bold">Adres opgeslagen!</span>
          </div>
        )}

        {/* Adressenlijst */}
        {adressen.map(a => (
          <div key={a.id} className="card p-4 flex items-start gap-3">
            {/* Icoon */}
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: a.isStandaard ? "#2B4030" + "15" : "#EDE4D2", color: a.isStandaard ? "#2B4030" : "#8A8A83" }}>
              {ICONS[a.icon]}
            </div>

            {/* Tekst */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-sm">{a.label}</p>
                {a.isStandaard && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: "#2B4030", color: "white" }}>
                    Standaard
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: "#8A8A83" }}>
                {a.straat} {a.huisnr}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>
                {a.postcode} {a.stad}
              </p>
            </div>

            {/* Acties */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => openEdit(a)}
                className="touch-scale w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#EDE4D2" }}>
                <Edit3 size={13} style={{ color: "#8A8A83" }} />
              </button>
              {!a.isStandaard && (
                <>
                  <button onClick={() => setStandaard(a.id)}
                    className="touch-scale w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "#EDE4D2" }}>
                    <Star size={13} style={{ color: "#f59e0b" }} />
                  </button>
                  <button onClick={() => deleteAdres(a.id)}
                    className="touch-scale w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "#fee2e2" }}>
                    <Trash2 size={13} style={{ color: "#dc2626" }} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {adressen.length === 0 && (
          <div className="text-center py-14">
            <p className="text-5xl mb-3">📍</p>
            <p className="font-bold text-base">Geen adressen opgeslagen</p>
            <p className="text-sm mt-1" style={{ color: "#8A8A83" }}>
              Voeg je thuisadres toe voor sneller boeken
            </p>
          </div>
        )}

        {/* Info card */}
        <div className="p-4 rounded-2xl" style={{ background: "#2B4030" + "10" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#2B4030" }}>
            🔒 <strong>Privacy.</strong> Je exacte adres wordt nooit gedeeld met een vakman totdat je een offerte accepteert. Vakmensen zien alleen je buurt.
          </p>
        </div>
      </div>

      {/* Formulier modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl p-6 pb-safe flex flex-col gap-4 animate-slide-up"
            style={{ background: "#F5EFE5" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-black text-lg">{editId ? "Adres bewerken" : "Nieuw adres"}</p>
              <button onClick={() => setShowForm(false)}
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EDE4D2" }}>
                <X size={15} style={{ color: "#8A8A83" }} />
              </button>
            </div>

            {/* Type */}
            <div className="flex gap-2">
              {ICON_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => f("icon", opt.value)}
                  className="touch-scale flex-1 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all"
                  style={{
                    borderColor: form.icon === opt.value ? "#2B4030" : "#E5DDD0",
                    background: form.icon === opt.value ? "#2B4030" + "12" : "transparent",
                    color: form.icon === opt.value ? "#2B4030" : "#8A8A83",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Label */}
            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>
                Naam (optioneel)
              </label>
              <input value={form.label} onChange={e => f("label", e.target.value)}
                placeholder={form.icon === "home" ? "Thuis" : form.icon === "work" ? "Werk" : "Bijv. Ouders"}
                className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                style={{ borderColor: "#E5DDD0", background: "#FBF7F0", color: "#1A1D1A" }} />
            </div>

            {/* Straat + huisnr */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>Straat *</label>
                <input value={form.straat} onChange={e => f("straat", e.target.value)}
                  placeholder="Prinsengracht"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: form.straat ? "#2B4030" : "#E5DDD0", background: "#FBF7F0", color: "#1A1D1A" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>Nr.</label>
                <input value={form.huisnr} onChange={e => f("huisnr", e.target.value)}
                  placeholder="124"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: "#E5DDD0", background: "#FBF7F0", color: "#1A1D1A" }} />
              </div>
            </div>

            {/* Postcode + stad */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>Postcode *</label>
                <input value={form.postcode} onChange={e => f("postcode", e.target.value)}
                  placeholder="1015 EA"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: form.postcode ? "#2B4030" : "#E5DDD0", background: "#FBF7F0", color: "#1A1D1A" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>Stad *</label>
                <input value={form.stad} onChange={e => f("stad", e.target.value)}
                  placeholder="Amsterdam"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: form.stad ? "#2B4030" : "#E5DDD0", background: "#FBF7F0", color: "#1A1D1A" }} />
              </div>
            </div>

            {/* Opslaan */}
            <button
              onClick={saveForm}
              disabled={!form.straat || !form.postcode || !form.stad}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm"
              style={{
                background: form.straat && form.postcode && form.stad ? "#2B4030" : "#8A8A83",
              }}>
              {editId ? "Wijzigingen opslaan" : "Adres toevoegen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
