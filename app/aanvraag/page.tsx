"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, Star, MapPin, Clock,
  ChevronRight, Camera, X, Zap, MessageCircle, Phone,
  Shield, FileText, Users, TrendingDown, CheckCircle, Euro,
  Wrench, Paintbrush, Hammer, Sparkles, Leaf, Package, Lock,
  Thermometer, Building2, Waves, Monitor, Sun, Flame, Wind,
  Layers, Bell, LayoutGrid, Car, Droplets, Grid3X3,
  Settings2, LucideIcon,
} from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";
import { useRouter } from "next/navigation";

// ── Categorie-iconen ───────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, LucideIcon> = {
  loodgieter: Wrench, elektricien: Zap, schilder: Paintbrush,
  timmerman: Hammer, schoonmaak: Sparkles, tuinman: Leaf,
  verhuizen: Package, sloten: Lock, hvac: Thermometer,
  dak: Building2, zwembad: Waves, glas: Grid3X3,
  "tuin-aanleg": Leaf, it: Monitor, bestrating: Layers,
  klusser: Settings2, zonnepanelen: Sun, gevel: Building2,
  verwarming: Flame, garage: Car, isolatie: Layers,
  riolering: Droplets, intercom: Bell, tegels: LayoutGrid,
  parket: Layers, airco: Wind, pergola: Leaf,
  oprit: Hammer, rolluiken: Layers, andere: Settings2,
};

const CATEGORIEËN = [
  { id: "loodgieter",  label: "Loodgieter" },
  { id: "elektricien", label: "Elektricien" },
  { id: "schilder",    label: "Schilder" },
  { id: "timmerman",   label: "Timmerman" },
  { id: "schoonmaak",  label: "Schoonmaak" },
  { id: "tuinman",     label: "Tuinman" },
  { id: "hvac",        label: "HVAC/CV" },
  { id: "klusser",     label: "Klusser" },
  { id: "schilder",    label: "Stukadoor" },
  { id: "tegels",      label: "Tegelzetter" },
  { id: "parket",      label: "Parketlegger" },
  { id: "verhuizen",   label: "Verhuizing" },
  { id: "dak",         label: "Dakdekker" },
  { id: "airco",       label: "Airco" },
  { id: "isolatie",    label: "Isolatie" },
  { id: "andere",      label: "Andere" },
];

const BUDGET_OPTIES = [
  { label: "< €100",       min: 0,   max: 100  },
  { label: "€100–€300",    min: 100, max: 300  },
  { label: "€300–€750",    min: 300, max: 750  },
  { label: "€750–€1.500",  min: 750, max: 1500 },
  { label: "> €1.500",     min: 1500, max: 9999 },
];

// Gebruik de eerste 4 providers als mock-offertes
const OFFERTES_MOCK = [
  { provider: PROVIDERS[0], prijs: 85,  prijs_label: "€85/u", eta: "Morgen 10:00", beschikbaar: true  },
  { provider: PROVIDERS[2], prijs: 78,  prijs_label: "€78/u", eta: "Morgen 13:00", beschikbaar: true  },
  { provider: PROVIDERS[3], prijs: 95,  prijs_label: "€95/u", eta: "Vandaag 17:00", beschikbaar: true  },
  { provider: PROVIDERS[1], prijs: 70,  prijs_label: "€70/u", eta: "Overmorgen",   beschikbaar: false },
];

type Stap = "categorie" | "beschrijving" | "budget" | "zoeken" | "vergelijk" | "bevestigd";

export default function AanvraagPage() {
  const router = useRouter();

  const [stap, setStap] = useState<Stap>("categorie");
  const [categorie, setCategorie] = useState<string | null>(null);
  const [categorieLabel, setCategorieLabel] = useState("");
  const [andereText, setAndereText] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [budgetLabel, setBudgetLabel] = useState("");
  const [aantalGevonden, setAantalGevonden] = useState(0);
  const [gekozenOfferte, setGekozenOfferte] = useState<typeof OFFERTES_MOCK[0] | null>(null);

  // ── Zoek-simulatie ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (stap !== "zoeken") return;
    setAantalGevonden(0);
    const t1 = setTimeout(() => setAantalGevonden(1), 1800);
    const t2 = setTimeout(() => setAantalGevonden(2), 3200);
    const t3 = setTimeout(() => setAantalGevonden(3), 5000);
    const t4 = setTimeout(() => setStap("vergelijk"), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [stap]);

  const volledigCategorie = categorie === "andere" ? andereText.trim() : categorieLabel;
  const stapNr: Record<Stap, number> = { categorie: 1, beschrijving: 2, budget: 3, zoeken: 4, vergelijk: 4, bevestigd: 5 };
  const totaalStappen = 4;

  // ── BEVESTIGD ───────────────────────────────────────────────────────────────
  if (stap === "bevestigd" && gekozenOfferte) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center px-5 pb-10 animate-fade-in"
        style={{ background: "#F9FAFB" }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
          <CheckCircle size={40} color="white" />
        </div>
        <h1 className="font-black text-2xl text-center mb-2">Aanvraag verstuurd!</h1>
        <p className="text-sm text-center mb-8" style={{ color: "#9CA3AF" }}>
          {gekozenOfferte.provider.name} heeft je aanvraag ontvangen en neemt snel contact op.
        </p>

        {/* Samenvatting kaart */}
        <div className="w-full rounded-2xl overflow-hidden mb-4"
          style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3.5 p-4 border-b" style={{ borderColor: "#F3F4F6" }}>
            <img src={gekozenOfferte.provider.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
            <div className="flex-1">
              <p className="font-black text-base">{gekozenOfferte.provider.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold">{gekozenOfferte.provider.rating}</span>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>({gekozenOfferte.provider.reviewCount} reviews)</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-lg" style={{ color: "#4F46E5" }}>{gekozenOfferte.prijs_label}</p>
              <p className="text-xs font-semibold" style={{ color: "#10B981" }}>{gekozenOfferte.eta}</p>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {[
              { icon: Wrench,   label: "Dienst",      val: volledigCategorie },
              { icon: FileText, label: "Omschrijving", val: beschrijving || "Geen omschrijving" },
              { icon: Euro,     label: "Budget",       val: budgetLabel },
            ].map(r => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#EEF2FF" }}>
                    <Icon size={14} style={{ color: "#4F46E5" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase" style={{ color: "#9CA3AF" }}>{r.label}</p>
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>{r.val}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-2.5 w-full p-3.5 rounded-2xl mb-6"
          style={{ background: "#EEF2FF" }}>
          <Shield size={15} style={{ color: "#4F46E5", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs leading-relaxed" style={{ color: "#4F46E5" }}>
            Jouw adresgegevens worden <strong>pas gedeeld</strong> nadat je de offerte definitief accepteert.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link href={`/chat/${gekozenOfferte.provider.id}`}
            className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-center"
            style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
            Chat met {gekozenOfferte.provider.name.split(" ")[0]}
          </Link>
          <Link href="/"
            className="touch-scale w-full py-3 text-center text-sm font-semibold"
            style={{ color: "#9CA3AF" }}>
            Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  // ── VERGELIJK ───────────────────────────────────────────────────────────────
  if (stap === "vergelijk") {
    const beschikbare = OFFERTES_MOCK.filter(o => o.beschikbaar);
    const goedkoopste = beschikbare.reduce((a, b) => a.prijs < b.prijs ? a : b);

    return (
      <div className="flex flex-col min-h-full pb-10 animate-fade-in" style={{ background: "#F9FAFB" }}>
        {/* Header */}
        <div className="sticky top-0 z-20 px-4 pt-12 pb-4"
          style={{ background: "rgba(249,250,251,0.97)", borderBottom: "1px solid #F3F4F6", backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => setStap("budget")}
              className="touch-scale w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#fff", border: "1px solid #F3F4F6" }}>
              <ArrowLeft size={17} style={{ color: "#111827" }} />
            </button>
            <div className="flex-1">
              <h1 className="font-black text-lg">Offertes vergelijken</h1>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>{beschikbare.length} vakmensen beschikbaar</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-4">

          {/* Beste deal banner */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", color: "white" }}>
            <TrendingDown size={18} />
            <div>
              <p className="font-bold text-sm">Beste prijs</p>
              <p className="text-xs opacity-80">{goedkoopste.provider.name} — {goedkoopste.prijs_label}</p>
            </div>
          </div>

          {/* Offerte-kaarten */}
          {OFFERTES_MOCK.map((o, i) => {
            const isBest = o.provider.id === goedkoopste.provider.id;
            const isGekozen = gekozenOfferte?.provider.id === o.provider.id;
            return (
              <div key={i}>
                <button
                  onClick={() => o.beschikbaar && setGekozenOfferte(o)}
                  disabled={!o.beschikbaar}
                  className="touch-scale w-full text-left rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: "#fff",
                    border: `2px solid ${isGekozen ? "#4F46E5" : isBest && o.beschikbaar ? "#10B981" : "#F3F4F6"}`,
                    boxShadow: isGekozen ? "0 0 0 4px rgba(79,70,229,0.12)" : "0 1px 8px rgba(0,0,0,0.05)",
                    opacity: o.beschikbaar ? 1 : 0.5,
                  }}>
                  {/* Badge */}
                  {isBest && o.beschikbaar && (
                    <div className="px-3 py-1.5 flex items-center gap-1.5"
                      style={{ background: "#ECFDF5", borderBottom: "1px solid #D1FAE5" }}>
                      <Check size={12} style={{ color: "#10B981" }} />
                      <span className="text-[11px] font-black" style={{ color: "#10B981" }}>BESTE PRIJS</span>
                    </div>
                  )}
                  {!o.beschikbaar && (
                    <div className="px-3 py-1.5" style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                      <span className="text-[11px] font-bold" style={{ color: "#9CA3AF" }}>NIET BESCHIKBAAR</span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <img src={o.provider.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white"
                          style={{ background: "#4F46E5", color: "white" }}>
                          {o.provider.servrScore}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base">{o.provider.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold">{o.provider.rating}</span>
                            <span className="text-xs" style={{ color: "#9CA3AF" }}>({o.provider.reviewCount})</span>
                          </div>
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>·</span>
                          <div className="flex items-center gap-1">
                            <MapPin size={10} style={{ color: "#9CA3AF" }} />
                            <span className="text-xs" style={{ color: "#9CA3AF" }}>{o.provider.distance}</span>
                          </div>
                        </div>
                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {o.provider.badges.slice(0, 2).map(b => (
                            <span key={b} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-xl" style={{ color: "#4F46E5" }}>{o.prijs_label}</p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: "#10B981" }}>{o.eta}</p>
                      </div>
                    </div>

                    {/* Kies-knop */}
                    {o.beschikbaar && (
                      <div className="flex gap-2">
                        <Link href={`/chat/${o.provider.id}`}
                          onClick={e => e.stopPropagation()}
                          className="touch-scale flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl font-semibold text-sm border"
                          style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                          <MessageCircle size={14} /> Chat
                        </Link>
                        <button
                          onClick={() => setGekozenOfferte(o)}
                          className="touch-scale flex-[2] py-2.5 rounded-xl font-bold text-sm transition-all"
                          style={{
                            background: isGekozen ? "#4F46E5" : "#EEF2FF",
                            color: isGekozen ? "white" : "#4F46E5",
                          }}>
                          {isGekozen ? "✓ Geselecteerd" : "Selecteer"}
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}

          {/* Bevestig knop */}
          <div className="pt-2">
            <button
              onClick={() => gekozenOfferte && setStap("bevestigd")}
              disabled={!gekozenOfferte}
              className="touch-scale w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2"
              style={{
                background: gekozenOfferte
                  ? "linear-gradient(135deg, #4F46E5, #6366F1)"
                  : "#D1D5DB",
              }}>
              <Check size={18} />
              {gekozenOfferte ? `Kies ${gekozenOfferte.provider.name.split(" ")[0]}` : "Selecteer een vakman"}
            </button>
            <p className="text-center text-xs mt-2" style={{ color: "#9CA3AF" }}>
              Geen verplichtingen — je betaalt pas na de klus
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── ZOEKEN ───────────────────────────────────────────────────────────────────
  if (stap === "zoeken") {
    return (
      <div className="flex flex-col min-h-full items-center justify-center px-5 animate-fade-in"
        style={{ background: "#F9FAFB" }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
          <Users size={36} color="white" />
        </div>
        <h2 className="font-black text-xl text-center mb-2">Vakmensen zoeken...</h2>
        <p className="text-sm text-center mb-8" style={{ color: "#9CA3AF" }}>
          We contacteren vakmensen in jouw buurt voor <strong>{volledigCategorie}</strong>
        </p>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full mb-8" style={{ background: "#F3F4F6" }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: aantalGevonden === 0 ? "15%" : aantalGevonden === 1 ? "45%" : aantalGevonden === 2 ? "75%" : "100%",
              background: "linear-gradient(90deg, #4F46E5, #6366F1)",
            }} />
        </div>

        {/* Gevonden vakmensen */}
        <div className="w-full flex flex-col gap-3">
          {aantalGevonden === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "#fff", border: "1px solid #F3F4F6" }}>
              <div className="w-10 h-10 border-2 rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: "#4F46E5", borderTopColor: "transparent" }} />
              <p className="text-sm font-semibold" style={{ color: "#9CA3AF" }}>Vakmensen worden gealarmeerd...</p>
            </div>
          )}
          {OFFERTES_MOCK.slice(0, aantalGevonden).map((o, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl animate-slide-up"
              style={{ background: "#fff", border: "1px solid #F3F4F6", animationDelay: `${i * 0.05}s` }}>
              <img src={o.provider.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <p className="font-bold text-sm">{o.provider.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold">{o.provider.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: "#ECFDF5" }}>
                <Check size={11} style={{ color: "#10B981" }} />
                <span className="text-xs font-bold" style={{ color: "#10B981" }}>Beschikbaar</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── STAPPEN 1-3 ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in" style={{ background: "#F9FAFB" }}>

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-12 pb-4"
        style={{ background: "rgba(249,250,251,0.97)", borderBottom: "1px solid #F3F4F6", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (stap === "categorie") router.back();
              else if (stap === "beschrijving") setStap("categorie");
              else if (stap === "budget") setStap("beschrijving");
            }}
            className="touch-scale w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#fff", border: "1px solid #F3F4F6" }}>
            <ArrowLeft size={17} style={{ color: "#111827" }} />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-lg">Offerte aanvragen</h1>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Stap {stapNr[stap]} van {totaalStappen}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1 mt-3 rounded-full" style={{ background: "#F3F4F6" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(stapNr[stap] / totaalStappen) * 100}%`,
              background: "linear-gradient(90deg, #4F46E5, #6366F1)",
            }} />
        </div>
      </div>

      <div className="px-4 pt-5 flex flex-col gap-5">

        {/* ── STAP 1: Categorie ── */}
        {stap === "categorie" && (
          <div className="animate-slide-up">
            <p className="font-black text-xl mb-1">Wat heb je nodig?</p>
            <p className="text-sm mb-5" style={{ color: "#9CA3AF" }}>
              Kies een categorie — meerdere vakmensen bieden dan op jouw aanvraag
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIEËN.map(c => {
                const Icon = CAT_ICONS[c.id] ?? Settings2;
                const isGek = categorie === c.id;
                return (
                  <button key={c.id + c.label}
                    onClick={() => { setCategorie(c.id); setCategorieLabel(c.label); }}
                    className="touch-scale flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all"
                    style={{
                      borderColor: isGek ? "#4F46E5" : "#F3F4F6",
                      background: isGek ? "#EEF2FF" : "#fff",
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isGek ? "#4F46E5" : "#F3F4F6" }}>
                      <Icon size={16} style={{ color: isGek ? "white" : "#6B7280" }} strokeWidth={1.8} />
                    </div>
                    <span className="font-semibold text-sm" style={{ color: isGek ? "#4F46E5" : "#111827" }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Andere optie */}
            <div className="mt-3 flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2"
              style={{
                borderColor: categorie === "andere" ? "#4F46E5" : "#F3F4F6",
                background: "#fff",
              }}>
              <Settings2 size={16} style={{ color: "#9CA3AF" }} />
              <input type="text"
                placeholder="Andere dienst, bijv. zwembad reinigen..."
                value={andereText}
                onChange={e => {
                  setAndereText(e.target.value);
                  if (e.target.value) { setCategorie("andere"); setCategorieLabel(e.target.value); }
                  else { if (categorie === "andere") setCategorie(null); }
                }}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "#111827" }}
              />
            </div>

            <button
              onClick={() => categorie && setStap("beschrijving")}
              disabled={!categorie}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white mt-5 flex items-center justify-center gap-2"
              style={{ background: categorie ? "linear-gradient(135deg, #4F46E5, #6366F1)" : "#D1D5DB" }}>
              Volgende <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STAP 2: Beschrijving ── */}
        {stap === "beschrijving" && (
          <div className="animate-slide-up">
            <p className="font-black text-xl mb-1">Beschrijf het probleem</p>
            <p className="text-sm mb-5" style={{ color: "#9CA3AF" }}>
              Hoe meer detail, hoe nauwkeuriger de offerte van de vakman
            </p>

            <textarea
              value={beschrijving}
              onChange={e => setBeschrijving(e.target.value)}
              placeholder={`Bijv. "De kraan in de badkamer lekt al 3 dagen. Er is een kleine waterstraal zichtbaar bij de aansluiting..."`}
              rows={5}
              className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm resize-none"
              style={{
                borderColor: beschrijving ? "#4F46E5" : "#E5E7EB",
                background: "#fff",
                color: "#111827",
                boxShadow: beschrijving ? "0 0 0 3px rgba(79,70,229,0.1)" : "none",
              }}
            />

            <p className="text-xs mt-1 text-right" style={{ color: "#9CA3AF" }}>{beschrijving.length}/500</p>

            {/* Foto */}
            <div className="mt-4">
              <p className="text-xs font-bold uppercase mb-2" style={{ color: "#9CA3AF" }}>
                Foto toevoegen <span className="font-normal normal-case">(aanbevolen)</span>
              </p>
              {foto ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={foto} alt="" className="w-full h-40 object-cover" />
                  <button onClick={() => setFoto(null)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <X size={14} color="white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setFoto("https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400")}
                  className="touch-scale w-full h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
                  style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
                  <Camera size={22} style={{ color: "#9CA3AF" }} />
                  <p className="text-sm font-semibold" style={{ color: "#9CA3AF" }}>Foto toevoegen</p>
                </button>
              )}
            </div>

            <button
              onClick={() => setStap("budget")}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white mt-5 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
              Volgende <ArrowRight size={16} />
            </button>
            <button onClick={() => setStap("budget")}
              className="touch-scale w-full py-2.5 mt-2 text-sm font-semibold text-center"
              style={{ color: "#9CA3AF" }}>
              Overslaan
            </button>
          </div>
        )}

        {/* ── STAP 3: Budget ── */}
        {stap === "budget" && (
          <div className="animate-slide-up">
            <p className="font-black text-xl mb-1">Wat is je budget?</p>
            <p className="text-sm mb-5" style={{ color: "#9CA3AF" }}>
              Dit helpt vakmensen om een passende offerte op te stellen
            </p>

            <div className="flex flex-col gap-2.5">
              {BUDGET_OPTIES.map(b => {
                const isGek = budget === b.min;
                return (
                  <button key={b.label}
                    onClick={() => { setBudget(b.min); setBudgetLabel(b.label); }}
                    className="touch-scale flex items-center justify-between px-4 py-4 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: isGek ? "#4F46E5" : "#F3F4F6",
                      background: isGek ? "#EEF2FF" : "#fff",
                    }}>
                    <span className="font-bold text-sm" style={{ color: isGek ? "#4F46E5" : "#111827" }}>
                      {b.label}
                    </span>
                    {isGek && <Check size={18} style={{ color: "#4F46E5" }} />}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-3.5 rounded-2xl flex items-start gap-2.5"
              style={{ background: "#EEF2FF" }}>
              <Shield size={15} style={{ color: "#4F46E5", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: "#4F46E5" }}>
                Je budget is een indicatie. Vakmensen kunnen een lagere of hogere offerte sturen — jij kiest altijd zelf.
              </p>
            </div>

            <button
              onClick={() => budget !== null && setStap("zoeken")}
              disabled={budget === null}
              className="touch-scale w-full py-4 rounded-2xl font-black text-white mt-5 flex items-center justify-center gap-2 text-base"
              style={{
                background: budget !== null
                  ? "linear-gradient(135deg, #4F46E5, #6366F1)"
                  : "#D1D5DB",
              }}>
              <Zap size={18} /> Vakmensen zoeken
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
