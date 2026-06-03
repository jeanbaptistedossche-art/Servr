"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, MapPin, ChevronDown, AlertTriangle, Sparkles } from "lucide-react";
import { supabase, supabaseReady } from "@/lib/supabase";
import { useUserStore } from "@/lib/store";

const CATEGORIEEN = [
  { icon: "🔧", label: "Loodgieter" },
  { icon: "⚡", label: "Elektricien" },
  { icon: "🖌️", label: "Schilder" },
  { icon: "🧹", label: "Schoonmaak" },
  { icon: "🪚", label: "Timmerman" },
  { icon: "🔑", label: "Slotenmaker" },
  { icon: "❄️", label: "HVAC" },
  { icon: "🏠", label: "Dakdekker" },
  { icon: "🌿", label: "Tuinman" },
  { icon: "📦", label: "Verhuizen" },
];

type Urgentie = "laag" | "middel" | "hoog";

function NieuweOpdrachtContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categorie, setCategorie] = useState<string | null>(searchParams.get("categorie"));
  const [titel, setTitel] = useState(searchParams.get("titel") ?? "");
  const [beschrijving, setBeschrijving] = useState(searchParams.get("beschrijving") ?? "");
  const [adres, setAdres] = useState("Prinsengracht 263, Amsterdam");
  const [urgentie, setUrgentie] = useState<Urgentie>((searchParams.get("urgentie") as Urgentie) ?? "middel");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(
    searchParams.get("categorie") ? `✓ ${searchParams.get("categorie")} · via stem` : null
  );
  const [budget, setBudget] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setFoto(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!categorie || !titel) return;
    setSubmitting(true);
    // Haal userId op — ook rechtstreeks uit Supabase sessie als fallback
    let userId = useUserStore.getState().userId;
    if (!userId && supabaseReady) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    if (!userId) { alert("Je bent niet ingelogd."); setSubmitting(false); return; }

    const { data, error } = await (supabase.from("opdrachten") as any).insert({
      klant_id: userId,
      titel,
      beschrijving,
      categorie,
      adres,
      urgentie,
      budget: budget || null,
      status: "open",
    }).select("id").single();

    if (error) {
      alert("Fout bij opslaan: " + error.message);
      setSubmitting(false);
      return;
    }
    // Push notificatie naar vakmensen
    fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorie, titel, beschrijving, opdrachtId: data?.id }),
    });

    router.push("/mijn-opdrachten?nieuw=1");
    setSubmitting(false);
  };

  const urgentieConfig: Record<Urgentie, { label: string; color: string; bg: string }> = {
    laag: { label: "Niet urgent", color: "#2B4030", bg: "#EAF0EC" },
    middel: { label: "Komende week", color: "#C97A4D", bg: "#FAF0E6" },
    hoog: { label: "SPOED — Zo snel mogelijk", color: "#8A3A2A", bg: "#F9EDEA" },
  };

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "#F5EFE5", borderBottom: "1px solid #E5DDD0" }}>
        <button onClick={() => step > 1 ? setStep(s => (s - 1) as 1|2|3) : router.back()}
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-lg">Nieuwe opdracht</h1>
          <p className="text-xs" style={{ color: "#8A8A83" }}>Stap {step} van 3</p>
        </div>
        {/* Progressbar */}
        <div className="flex gap-1">
          {[1,2,3].map(s => (
            <div key={s} className="h-1.5 w-8 rounded-full transition-all"
              style={{ background: s <= step ? "#2B4030" : "#EDE4D2" }} />
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5 flex-1">

        {/* ─── STAP 1: Categorie + details ─── */}
        {step === 1 && (
          <>
            <div>
              <p className="font-black text-base mb-3">Wat voor vakman heb je nodig?</p>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIEEN.map(c => (
                  <button key={c.label} onClick={() => setCategorie(c.label)}
                    className="touch-scale flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: categorie === c.label ? "#2B4030" : "#E5DDD0",
                      background: categorie === c.label ? "#2B4030" + "10" : "#FBF7F0",
                    }}>
                    <span className="text-2xl">{c.icon}</span>
                    <span className="text-[10px] font-medium text-center leading-tight"
                      style={{ color: categorie === c.label ? "#2B4030" : "#1A1D1A" }}>
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>
                Korte titel *
              </label>
              <input value={titel} onChange={e => setTitel(e.target.value)}
                placeholder="bijv. Lekkende kraan keuken"
                className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm"
                style={{ borderColor: titel ? "#2B4030" : "#E5DDD0", background: "#FBF7F0", color: "#1A1D1A" }} />
            </div>

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>
                Beschrijving
              </label>
              <textarea value={beschrijving} onChange={e => setBeschrijving(e.target.value)}
                placeholder="Beschrijf het probleem zo duidelijk mogelijk..."
                rows={3}
                className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm resize-none"
                style={{ borderColor: "#E5DDD0", background: "#FBF7F0", color: "#1A1D1A" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <p className="text-xs" style={{ color: "#8A8A83" }}>{beschrijving.length}/500</p>
                {beschrijving.length > 10 && (
                  <button
                    onClick={async () => {
                      setAiLoading(true);
                      setAiSuggestion(null);
                      try {
                        const res = await fetch("/api/categorize", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ beschrijving }),
                        });
                        const data = await res.json();
                        if (data.error) {
                          setAiSuggestion("Fout: " + data.error);
                        } else if (data.categorie) {
                          setCategorie(data.categorie);
                          if (data.urgentie) setUrgentie(data.urgentie as Urgentie);
                          if (data.titel && !titel) setTitel(data.titel);
                          setAiSuggestion(`✓ ${data.categorie} · ${data.urgentie === "hoog" ? "Spoed" : data.urgentie === "laag" ? "Niet urgent" : "Normaal"}`);
                        } else {
                          setAiSuggestion("Onverwachte response: " + JSON.stringify(data));
                        }
                      } catch (err) { setAiSuggestion("Fout: " + String(err)); }
                      setAiLoading(false);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", background: aiLoading ? "#EDE4D2" : "#2B4030",
                      color: aiLoading ? "#8A8A83" : "#F5EFE5",
                      border: "none", borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: aiLoading ? "default" : "pointer",
                    }}>
                    <Sparkles size={12} />
                    {aiLoading ? "Analyseren…" : "AI analyseren"}
                  </button>
                )}
              </div>
              {aiSuggestion && (
                <p style={{ fontSize: 11, color: "#2B4030", background: "#EAF0EC", padding: "5px 10px", borderRadius: 8, marginTop: 4 }}>
                  {aiSuggestion}
                </p>
              )}
            </div>

            <button onClick={() => categorie && titel && setStep(2)}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white mt-auto"
              style={{ background: categorie && titel ? "#2B4030" : "#8A8A83" }}>
              Volgende stap →
            </button>
          </>
        )}

        {/* ─── STAP 2: Adres + urgentie + budget ─── */}
        {step === 2 && (
          <>
            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>
                📍 Jouw adres *
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
                style={{ borderColor: "#2B4030", background: "#FBF7F0" }}>
                <MapPin size={17} style={{ color: "#2B4030" }} />
                <input value={adres} onChange={e => setAdres(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "#1A1D1A" }} />
              </div>
              <div className="mt-2 p-3 rounded-xl flex items-start gap-2"
                style={{ background: "#2B4030" + "10" }}>
                <span className="text-sm">🔒</span>
                <p className="text-xs" style={{ color: "#2B4030" }}>
                  Je adres is <strong>alleen zichtbaar</strong> voor de vakman die jij selecteert. Nooit automatisch gedeeld.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase mb-2 block" style={{ color: "#8A8A83" }}>Urgentie</label>
              <div className="flex flex-col gap-2">
                {(["laag","middel","hoog"] as Urgentie[]).map(u => (
                  <button key={u} onClick={() => setUrgentie(u)}
                    className="touch-scale flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: urgentie === u ? urgentieConfig[u].color : "#E5DDD0",
                      background: urgentie === u ? urgentieConfig[u].bg : "#FBF7F0",
                    }}>
                    <AlertTriangle size={17} style={{ color: urgentieConfig[u].color }} />
                    <span className="font-semibold text-sm">{urgentieConfig[u].label}</span>
                    {urgentie === u && <span className="ml-auto text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "#8A8A83" }}>
                Budget (optioneel)
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
                style={{ borderColor: "#E5DDD0", background: "#FBF7F0" }}>
                <span className="font-bold text-sm">€</span>
                <input value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="bijv. 50-100"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "#1A1D1A" }} />
              </div>
              <p className="text-xs mt-1" style={{ color: "#8A8A83" }}>
                Een budget helpt vakmensen betere offertes te sturen
              </p>
            </div>

            <button onClick={() => setStep(3)}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white mt-auto"
              style={{ background: "#2B4030" }}>
              Volgende stap →
            </button>
          </>
        )}

        {/* ─── STAP 3: Foto + versturen ─── */}
        {step === 3 && (
          <>
            <div>
              <p className="font-black text-base mb-1">Foto toevoegen</p>
              <p className="text-sm mb-4" style={{ color: "#8A8A83" }}>
                Een foto helpt vakmensen beter inschatten wat er nodig is en een nauwkeuriger offerte te sturen.
              </p>

              {foto ? (
                <div className="relative rounded-3xl overflow-hidden">
                  <img src={foto} alt="opdracht" className="w-full h-52 object-cover" />
                  <button onClick={() => setFoto(null)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <span className="text-white text-sm">✕</span>
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                    📸 Foto toegevoegd
                  </div>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()}
                  className="touch-scale flex flex-col items-center gap-4 py-10 rounded-3xl border-2 border-dashed cursor-pointer"
                  style={{ borderColor: "#E5DDD0", background: "#FBF7F0" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "#2B4030" + "15" }}>
                    <Camera size={32} style={{ color: "#2B4030" }} />
                  </div>
                  <p className="text-sm font-medium text-center" style={{ color: "#8A8A83" }}>
                    Tik om foto te maken<br />of uit galerij te kiezen
                  </p>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFoto(e.target.files[0])} />
                </div>
              )}
            </div>

            {/* Samenvatting */}
            <div className="card p-4">
              <p className="text-xs font-bold uppercase mb-3" style={{ color: "#8A8A83" }}>Samenvatting</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#8A8A83" }}>Categorie</span>
                  <span className="font-semibold">{categorie}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#8A8A83" }}>Titel</span>
                  <span className="font-semibold truncate ml-4">{titel}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#8A8A83" }}>Urgentie</span>
                  <span className="font-semibold" style={{ color: urgentieConfig[urgentie].color }}>
                    {urgentieConfig[urgentie].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#8A8A83" }}>Adres</span>
                  <span className="font-semibold truncate ml-4 text-right max-w-[180px]">{adres}</span>
                </div>
                {budget && (
                  <div className="flex justify-between">
                    <span style={{ color: "#8A8A83" }}>Budget</span>
                    <span className="font-semibold">€{budget}</span>
                  </div>
                )}
              </div>
            </div>

            <button onClick={submit}
              disabled={submitting}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
              style={{ background: "#2B4030" }}>
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Opdracht plaatsen...
                </>
              ) : "🚀 Opdracht plaatsen"}
            </button>
            <p className="text-xs text-center" style={{ color: "#8A8A83" }}>
              Je adres wordt pas gedeeld als jij een offerte accepteert
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function NieuweOpdrachtPage() {
  return <Suspense><NieuweOpdrachtContent /></Suspense>;
}
