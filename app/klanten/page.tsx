"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Search, Star, Phone, Mail,
  MapPin, Euro, Clock, MessageCircle, X, Check,
  ChevronRight, Trash2, Edit3, Calendar, TrendingUp,
  Users, Heart, Tag, StickyNote, Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type KlantStatus = "actief" | "inactief" | "prospect";
type Label = "vip" | "snel_betaler" | "moeilijk" | "aanbevolen" | "nieuw";

type KlantJob = {
  datum: string;
  omschrijving: string;
  bedrag: number;
  status: "betaald" | "openstaand" | "offerte";
};

type Notitie = {
  id: string;
  datum: string;
  tekst: string;
};

type Klant = {
  id: string;
  naam: string;
  avatar: string;
  email?: string;
  telefoon?: string;
  adres?: string;
  status: KlantStatus;
  labels: Label[];
  rating: number;
  aangemaakt: string;
  laatsActief: string;
  jobs: KlantJob[];
  notities: Notitie[];
  bron?: string;
};

// ─── Label config ─────────────────────────────────────────────────────────────
const LABEL_CFG: Record<Label, { naam: string; kleur: string; bg: string; icon: string }> = {
  vip:           { naam: "VIP",          kleur: "#C97A4D", bg: "#FAF0E6", icon: "👑" },
  snel_betaler:  { naam: "Snelle betaler", kleur: "#2B4030", bg: "#EAF0EC", icon: "⚡" },
  moeilijk:      { naam: "Moeilijk",     kleur: "#8A3A2A", bg: "#F9EDEA", icon: "⚠️" },
  aanbevolen:    { naam: "Aanbevolen",   kleur: "#2B4030", bg: "#EAF0EC", icon: "🌟" },
  nieuw:         { naam: "Nieuw",        kleur: "#5C5C56", bg: "#F0EFE8", icon: "✨" },
};

const STATUS_CFG: Record<KlantStatus, { label: string; kleur: string; bg: string }> = {
  actief:    { label: "Actief",    kleur: "#2B4030", bg: "#EAF0EC" },
  inactief:  { label: "Inactief",  kleur: "#8A8A83", bg: "#F0EFE8" },
  prospect:  { label: "Prospect",  kleur: "#C97A4D", bg: "#FAF0E6" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_KLANTEN: Klant[] = [
  {
    id: "c1", naam: "Lisa de Vries", avatar: "https://i.pravatar.cc/150?img=32",
    email: "lisa@example.nl", telefoon: "06-12345678", adres: "Prinsengracht 88, Amsterdam",
    status: "actief", labels: ["vip", "snel_betaler"], rating: 5,
    aangemaakt: "2025-01-10", laatsActief: "2026-05-20", bron: "Servr",
    jobs: [
      { datum: "2026-05-20", omschrijving: "Lekkende kraan keuken",    bedrag: 85,  status: "betaald" },
      { datum: "2026-03-14", omschrijving: "Douche aftapkraan vervangen", bedrag: 120, status: "betaald" },
      { datum: "2026-01-05", omschrijving: "Toilet reparatie",         bedrag: 65,  status: "betaald" },
    ],
    notities: [
      { id: "n1", datum: "2026-05-20", tekst: "Altijd thuis na 14:00. Voorkeur voor snel reageren." },
      { id: "n2", datum: "2026-03-14", tekst: "Betaalt altijd direct via iDEAL. Topklant!" },
    ],
  },
  {
    id: "c2", naam: "Ahmed Mansour", avatar: "https://i.pravatar.cc/150?img=33",
    email: "ahmed.m@example.nl", telefoon: "06-98765432", adres: "Ferdinand Bolstraat 45, Amsterdam",
    status: "actief", labels: ["aanbevolen"], rating: 4,
    aangemaakt: "2025-06-01", laatsActief: "2026-05-15", bron: "Aanbeveling",
    jobs: [
      { datum: "2026-05-15", omschrijving: "CV ketel inspectie",       bedrag: 75,  status: "openstaand" },
      { datum: "2025-11-20", omschrijving: "Radiatoren ontluchten",    bedrag: 55,  status: "betaald" },
    ],
    notities: [
      { id: "n3", datum: "2026-05-15", tekst: "CV ketel is oud model Remeha Calenta. Filters regelmatig vervangen." },
    ],
  },
  {
    id: "c3", naam: "Petra Jansen", avatar: "https://i.pravatar.cc/150?img=47",
    email: "petra.jansen@gmail.com", telefoon: "06-55511223", adres: "Kinkerstraat 120, Amsterdam",
    status: "actief", labels: ["vip"], rating: 5,
    aangemaakt: "2024-11-15", laatsActief: "2026-04-22", bron: "Google",
    jobs: [
      { datum: "2026-04-22", omschrijving: "Woonkamer schilderen 45m²", bedrag: 520, status: "betaald" },
      { datum: "2026-02-10", omschrijving: "Hal + trap schilderen",     bedrag: 280, status: "betaald" },
      { datum: "2025-09-08", omschrijving: "Badkamer tegels leggen",    bedrag: 650, status: "betaald" },
      { datum: "2025-06-20", omschrijving: "Keukenkastjes vernieuwen",  bedrag: 390, status: "betaald" },
    ],
    notities: [
      { id: "n4", datum: "2026-04-22", tekst: "Petra heeft een prachtig appartement. Wil jaarlijks schilderbeurt." },
    ],
  },
  {
    id: "c4", naam: "Robin Smit", avatar: "https://i.pravatar.cc/150?img=15",
    email: "robinsmit@work.nl", telefoon: "06-44400011", adres: "Rijnstraat 14, Utrecht",
    status: "prospect", labels: ["nieuw"], rating: 0,
    aangemaakt: "2026-05-18", laatsActief: "2026-05-18", bron: "WhatsApp",
    jobs: [
      { datum: "2026-05-25", omschrijving: "Badkamer tegels — offerte", bedrag: 450, status: "offerte" },
    ],
    notities: [],
  },
  {
    id: "c5", naam: "Sara Bakker", avatar: "https://i.pravatar.cc/150?img=56",
    email: "sara.b@example.com", telefoon: "06-77788899",
    status: "inactief", labels: ["moeilijk"], rating: 2,
    aangemaakt: "2025-03-20", laatsActief: "2025-12-01", bron: "Servr",
    jobs: [
      { datum: "2025-12-01", omschrijving: "Elektra keuken vernieuwen", bedrag: 380, status: "betaald" },
      { datum: "2025-07-14", omschrijving: "Stopcontacten vervangen",   bedrag: 145, status: "betaald" },
    ],
    notities: [
      { id: "n5", datum: "2025-12-01", tekst: "Lastig over prijzen. Altijd discussie. Voorzichtig mee omgaan." },
    ],
  },
  {
    id: "c6", naam: "Kim Nguyen", avatar: "https://i.pravatar.cc/150?img=44",
    email: "kim.nguyen@example.nl", telefoon: "06-33322211", adres: "Hoofdstraat 7, Haarlem",
    status: "actief", labels: ["snel_betaler", "aanbevolen"], rating: 5,
    aangemaakt: "2025-08-05", laatsActief: "2026-05-10", bron: "Aanbeveling",
    jobs: [
      { datum: "2026-05-10", omschrijving: "Vloer schuren en lakken",  bedrag: 480, status: "betaald" },
      { datum: "2026-01-22", omschrijving: "Deur reparatie + hang",    bedrag: 95,  status: "betaald" },
    ],
    notities: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function totalOmzet(k: Klant) {
  return k.jobs.filter((j) => j.status === "betaald").reduce((s, j) => s + j.bedrag, 0);
}

function openstaand(k: Klant) {
  return k.jobs.filter((j) => j.status === "openstaand").reduce((s, j) => s + j.bedrag, 0);
}

function Stars({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={12} fill={i < n ? "#C97A4D" : "none"} style={{ color: i < n ? "#C97A4D" : "#E5DDD0" }} />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function KlantenPage() {
  const router = useRouter();

  const [klanten, setKlanten] = useState<Klant[]>(INIT_KLANTEN);
  const [zoek, setZoek] = useState("");
  const [statusFilter, setStatusFilter] = useState<KlantStatus | "alle">("alle");
  const [sortBy, setSortBy] = useState<"naam" | "omzet" | "recent">("recent");
  const [showDetail, setShowDetail] = useState<Klant | null>(null);
  const [showNieuw, setShowNieuw] = useState(false);
  const [detailTab, setDetailTab] = useState<"overzicht" | "jobs" | "notities">("overzicht");
  const [newNotitie, setNewNotitie] = useState("");
  const [showNotitiInput, setShowNotitiInput] = useState(false);

  const [form, setForm] = useState<Partial<Klant>>({ status: "prospect", labels: [], rating: 0 });

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...klanten];
    if (statusFilter !== "alle") list = list.filter((k) => k.status === statusFilter);
    if (zoek) {
      const q = zoek.toLowerCase();
      list = list.filter((k) =>
        k.naam.toLowerCase().includes(q) ||
        k.email?.toLowerCase().includes(q) ||
        k.telefoon?.includes(q) ||
        k.adres?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "naam")   list.sort((a, b) => a.naam.localeCompare(b.naam));
    if (sortBy === "omzet")  list.sort((a, b) => totalOmzet(b) - totalOmzet(a));
    if (sortBy === "recent") list.sort((a, b) => b.laatsActief.localeCompare(a.laatsActief));
    return list;
  }, [klanten, statusFilter, zoek, sortBy]);

  const totaleOmzet = useMemo(() => klanten.reduce((s, k) => s + totalOmzet(k), 0), [klanten]);
  const actiefCount = useMemo(() => klanten.filter((k) => k.status === "actief").length, [klanten]);
  const openstaandTotaal = useMemo(() => klanten.reduce((s, k) => s + openstaand(k), 0), [klanten]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const saveNieuw = useCallback(() => {
    if (!form.naam) return;
    const k: Klant = {
      id: `c${Date.now()}`,
      naam: form.naam,
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      email: form.email,
      telefoon: form.telefoon,
      adres: form.adres,
      status: form.status ?? "prospect",
      labels: form.labels ?? [],
      rating: form.rating ?? 0,
      aangemaakt: new Date().toISOString().slice(0, 10),
      laatsActief: new Date().toISOString().slice(0, 10),
      jobs: [],
      notities: [],
      bron: form.bron,
    };
    setKlanten((prev) => [k, ...prev]);
    setForm({ status: "prospect", labels: [], rating: 0 });
    setShowNieuw(false);
  }, [form]);

  const addNotitie = useCallback(() => {
    if (!showDetail || !newNotitie.trim()) return;
    const notitie: Notitie = {
      id: `n${Date.now()}`,
      datum: new Date().toISOString().slice(0, 10),
      tekst: newNotitie.trim(),
    };
    const updated = { ...showDetail, notities: [notitie, ...showDetail.notities] };
    setKlanten((prev) => prev.map((k) => k.id === showDetail.id ? updated : k));
    setShowDetail(updated);
    setNewNotitie("");
    setShowNotitiInput(false);
  }, [showDetail, newNotitie]);

  const deleteKlant = useCallback((id: string) => {
    setKlanten((prev) => prev.filter((k) => k.id !== id));
    setShowDetail(null);
  }, []);

  const toggleLabel = useCallback((label: Label) => {
    setForm((f) => {
      const labels = f.labels ?? [];
      return {
        ...f,
        labels: labels.includes(label) ? labels.filter((l) => l !== label) : [...labels, label],
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Klantenbestand
            </h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83" }}>{klanten.length} contacten · CRM</p>
          </div>
          <button onClick={() => setShowNieuw(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold"
            style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
            <Plus size={15} />
            Nieuw
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 mb-3"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px" }}>
          <Search size={15} style={{ color: "#8A8A83" }} />
          <input value={zoek} onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op naam, email, telefoon…"
            className="flex-1 text-sm bg-transparent"
            style={{ color: "#1A1D1A", outline: "none", fontSize: 14 }} />
        </div>

        {/* Filter + sort row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
            {(["alle", "actief", "inactief", "prospect"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold capitalize"
                style={{
                  background: statusFilter === s ? "#2B4030" : "transparent",
                  color: statusFilter === s ? "#F5EFE5" : "#5C5C56",
                  borderRadius: 99,
                  border: statusFilter === s ? "none" : "0.5px solid #E5DDD0",
                }}>
                {s === "alle" ? "Alles" : STATUS_CFG[s as KlantStatus]?.label ?? s}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold appearance-none"
            style={{ background: "#FBF7F0", color: "#5C5C56", border: "0.5px solid #E5DDD0", borderRadius: 8 }}>
            <option value="recent">Recent</option>
            <option value="omzet">Omzet</option>
            <option value="naam">Naam</option>
          </select>
        </div>
      </div>

      <div className="px-5 pb-28 mt-4">
        {/* Summary stat grid */}
        <div className="grid grid-cols-3 gap-2 mb-4"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-bold text-2xl leading-tight"
              style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>{actiefCount}</p>
            <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Actief</p>
          </div>
          <div className="flex flex-col items-center gap-0.5" style={{ borderLeft: "0.5px solid #E5DDD0", borderRight: "0.5px solid #E5DDD0" }}>
            <p className="font-bold text-xl leading-tight"
              style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              {fmtEur(totaleOmzet)}
            </p>
            <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Totale omzet</p>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-bold text-xl leading-tight"
              style={{ color: openstaandTotaal > 0 ? "#C97A4D" : "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              {fmtEur(openstaandTotaal)}
            </p>
            <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Openstaand</p>
          </div>
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
            <p className="text-3xl mb-2">👥</p>
            <p className="font-semibold" style={{ color: "#1A1D1A" }}>Geen klanten gevonden</p>
            <p className="text-sm mt-1" style={{ color: "#8A8A83" }}>Pas de filter aan of voeg een nieuwe klant toe</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((k) => {
              const omzet = totalOmzet(k);
              const open = openstaand(k);
              const statusCfg = STATUS_CFG[k.status];
              return (
                <button key={k.id} onClick={() => { setShowDetail(k); setDetailTab("overzicht"); }}
                  className="w-full text-left"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                  <div className="flex items-center gap-3">
                    <img src={k.avatar} alt={k.naam}
                      className="w-11 h-11 object-cover flex-shrink-0"
                      style={{ borderRadius: 10, border: "0.5px solid #E5DDD0" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: "#1A1D1A" }}>{k.naam}</p>
                        <span className="text-xs font-medium px-2 py-0.5"
                          style={{ background: statusCfg.bg, color: statusCfg.kleur, borderRadius: 99 }}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {k.labels.map((l) => (
                          <span key={l} className="text-xs px-1.5 py-0.5"
                            style={{ background: LABEL_CFG[l].bg, color: LABEL_CFG[l].kleur, borderRadius: 99 }}>
                            {LABEL_CFG[l].icon}
                          </span>
                        ))}
                        {k.rating > 0 && <Stars n={k.rating} />}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#8A8A83" }}>
                        {k.jobs.length} klus{k.jobs.length !== 1 ? "sen" : ""} · {k.bron ?? "Servr"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold" style={{ color: "#2B4030" }}>{fmtEur(omzet)}</p>
                      {open > 0 && <p className="text-xs font-medium" style={{ color: "#C97A4D" }}>{fmtEur(open)} open</p>}
                      <ChevronRight size={14} style={{ color: "#E5DDD0", marginLeft: "auto", marginTop: 2 }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Klant detail sheet ───────────────────────────────────────────────── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowDetail(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[24px] overflow-hidden max-h-[92dvh] flex flex-col"
            style={{ background: "#F5EFE5" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Handle + header */}
            <div className="px-5 pt-4 pb-3 flex-shrink-0" style={{ background: "#F5EFE5" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center gap-3 mb-3">
                <img src={showDetail.avatar} alt={showDetail.naam}
                  className="w-14 h-14 object-cover flex-shrink-0"
                  style={{ borderRadius: 12, border: "0.5px solid #E5DDD0" }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                      {showDetail.naam}
                    </h2>
                    <span className="text-xs font-medium px-2 py-0.5"
                      style={{ background: STATUS_CFG[showDetail.status].bg, color: STATUS_CFG[showDetail.status].kleur, borderRadius: 99 }}>
                      {STATUS_CFG[showDetail.status].label}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap items-center">
                    {showDetail.labels.map((l) => (
                      <span key={l} className="text-xs font-medium px-2 py-0.5"
                        style={{ background: LABEL_CFG[l].bg, color: LABEL_CFG[l].kleur, borderRadius: 99 }}>
                        {LABEL_CFG[l].icon} {LABEL_CFG[l].naam}
                      </span>
                    ))}
                    {showDetail.rating > 0 && <Stars n={showDetail.rating} />}
                  </div>
                </div>
                <button onClick={() => setShowDetail(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  <X size={15} style={{ color: "#8A8A83" }} />
                </button>
              </div>

              {/* Quick contact */}
              <div className="flex gap-2 mb-3">
                {showDetail.telefoon && (
                  <a href={`tel:${showDetail.telefoon}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 10, color: "#2B4030" }}>
                    <Phone size={13} />
                    Bellen
                  </a>
                )}
                {showDetail.email && (
                  <a href={`mailto:${showDetail.email}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 10, color: "#2B4030" }}>
                    <Mail size={13} />
                    Mail
                  </a>
                )}
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                  style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 10, border: "none" }}>
                  <MessageCircle size={13} />
                  Chat
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#EDE8DF" }}>
                {(["overzicht", "jobs", "notities"] as const).map((t) => (
                  <button key={t} onClick={() => setDetailTab(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
                    style={{
                      background: detailTab === t ? "#FBF7F0" : "transparent",
                      color: detailTab === t ? "#2B4030" : "#8A8A83",
                    }}>
                    {t}
                    {t === "notities" && showDetail.notities.length > 0 && (
                      <span className="ml-1 text-xs" style={{ color: "#8A8A83" }}>({showDetail.notities.length})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {/* OVERZICHT */}
              {detailTab === "overzicht" && (
                <div className="flex flex-col gap-3 mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 12 }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "#8A8A83" }}>Totale omzet</p>
                      <p className="font-bold text-xl" style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                        {fmtEur(totalOmzet(showDetail))}
                      </p>
                    </div>
                    <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 12 }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "#8A8A83" }}>Klussen</p>
                      <p className="font-bold text-xl" style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                        {showDetail.jobs.length}
                      </p>
                    </div>
                    {openstaand(showDetail) > 0 && (
                      <div style={{ background: "#FAF0E6", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 12 }}>
                        <p className="text-xs font-medium mb-1" style={{ color: "#C97A4D" }}>Openstaand</p>
                        <p className="font-bold text-xl" style={{ color: "#C97A4D", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                          {fmtEur(openstaand(showDetail))}
                        </p>
                      </div>
                    )}
                    <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 12 }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "#8A8A83" }}>Klant sinds</p>
                      <p className="font-semibold text-sm" style={{ color: "#1A1D1A" }}>
                        {new Date(showDetail.aangemaakt).toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {(showDetail.telefoon || showDetail.email || showDetail.adres) && (
                    <div className="flex flex-col gap-3"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                      {showDetail.telefoon && (
                        <div className="flex items-center gap-3">
                          <Phone size={14} style={{ color: "#8A8A83" }} />
                          <p className="text-sm" style={{ color: "#5C5C56" }}>{showDetail.telefoon}</p>
                        </div>
                      )}
                      {showDetail.email && (
                        <div className="flex items-center gap-3">
                          <Mail size={14} style={{ color: "#8A8A83" }} />
                          <p className="text-sm truncate" style={{ color: "#5C5C56" }}>{showDetail.email}</p>
                        </div>
                      )}
                      {showDetail.adres && (
                        <div className="flex items-center gap-3">
                          <MapPin size={14} style={{ color: "#8A8A83" }} />
                          <p className="text-sm" style={{ color: "#5C5C56" }}>{showDetail.adres}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {showDetail.bron && (
                    <div className="flex items-center gap-2 px-4 py-3"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                      <Tag size={14} style={{ color: "#C97A4D" }} />
                      <p className="text-sm font-medium" style={{ color: "#5C5C56" }}>
                        Gevonden via: {showDetail.bron}
                      </p>
                    </div>
                  )}

                  <button onClick={() => deleteKlant(showDetail.id)}
                    className="w-full py-3 font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ background: "#F9EDEA", color: "#8A3A2A", borderRadius: 14, border: "0.5px solid #E5DDD0" }}>
                    <Trash2 size={15} />
                    Klant verwijderen
                  </button>
                </div>
              )}

              {/* JOBS */}
              {detailTab === "jobs" && (
                <div className="flex flex-col gap-2 mt-3">
                  {showDetail.jobs.length === 0 ? (
                    <div className="p-6 text-center"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                      <p className="text-2xl mb-2">🔧</p>
                      <p className="font-semibold" style={{ color: "#1A1D1A" }}>Nog geen klussen</p>
                    </div>
                  ) : showDetail.jobs.map((job, i) => (
                    <div key={i} className="flex items-center gap-3"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 14 }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: job.status === "betaald" ? "#2B4030" : job.status === "openstaand" ? "#C97A4D" : "#8A8A83" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1A1D1A" }}>{job.omschrijving}</p>
                        <p className="text-xs" style={{ color: "#8A8A83" }}>
                          {new Date(job.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold" style={{ color: "#1A1D1A" }}>{fmtEur(job.bedrag)}</p>
                        <p className="text-xs font-medium"
                          style={{ color: job.status === "betaald" ? "#2B4030" : job.status === "openstaand" ? "#C97A4D" : "#8A8A83" }}>
                          {job.status === "betaald" ? "Betaald" : job.status === "openstaand" ? "Openstaand" : "Offerte"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* NOTITIES */}
              {detailTab === "notities" && (
                <div className="flex flex-col gap-3 mt-3">
                  {!showNotitiInput ? (
                    <button onClick={() => setShowNotitiInput(true)}
                      className="w-full py-3 font-semibold text-sm flex items-center justify-center gap-2"
                      style={{ background: "transparent", color: "#2B4030", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                      <Plus size={15} />
                      Notitie toevoegen
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 14 }}>
                      <textarea value={newNotitie} onChange={(e) => setNewNotitie(e.target.value)}
                        placeholder="Schrijf een notitie over deze klant…"
                        rows={3} autoFocus
                        className="w-full resize-none text-sm"
                        style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none" }} />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowNotitiInput(false); setNewNotitie(""); }}
                          className="flex-1 py-2.5 font-semibold text-sm"
                          style={{ background: "transparent", color: "#5C5C56", border: "0.5px solid #E5DDD0", borderRadius: 99 }}>
                          Annuleer
                        </button>
                        <button onClick={addNotitie}
                          className="flex-1 py-2.5 font-semibold text-sm"
                          style={{ background: "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 99 }}>
                          Opslaan
                        </button>
                      </div>
                    </div>
                  )}

                  {showDetail.notities.length === 0 && !showNotitiInput ? (
                    <div className="p-6 text-center"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                      <StickyNote size={26} style={{ color: "#E5DDD0", margin: "0 auto 8px" }} />
                      <p className="font-semibold" style={{ color: "#1A1D1A" }}>Nog geen notities</p>
                      <p className="text-sm mt-1" style={{ color: "#8A8A83" }}>Voeg notities toe over afspraken, voorkeuren, etc.</p>
                    </div>
                  ) : showDetail.notities.map((n) => (
                    <div key={n.id}
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 14 }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "#8A8A83" }}>{n.datum}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#5C5C56" }}>{n.tekst}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Nieuw klant sheet ────────────────────────────────────────────────── */}
      {showNieuw && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowNieuw(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[24px] overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#FBF7F0" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  Nieuwe klant
                </h2>
                <button onClick={() => setShowNieuw(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                  <X size={15} style={{ color: "#8A8A83" }} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <NieuwField label="Naam *">
                  <input value={form.naam ?? ""} onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))}
                    placeholder="Volledige naam…" autoFocus
                    className="w-full"
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none" }} />
                </NieuwField>

                <div className="grid grid-cols-2 gap-3">
                  <NieuwField label="Email">
                    <input type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="email@…"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                  </NieuwField>
                  <NieuwField label="Telefoon">
                    <input type="tel" value={form.telefoon ?? ""} onChange={(e) => setForm((f) => ({ ...f, telefoon: e.target.value }))}
                      placeholder="06-…"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                  </NieuwField>
                </div>

                <NieuwField label="Adres">
                  <input value={form.adres ?? ""} onChange={(e) => setForm((f) => ({ ...f, adres: e.target.value }))}
                    placeholder="Straat + huisnummer, Stad…"
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                </NieuwField>

                <NieuwField label="Status">
                  <div className="flex gap-2">
                    {(["actief", "prospect", "inactief"] as KlantStatus[]).map((s) => (
                      <button key={s} onClick={() => setForm((f) => ({ ...f, status: s }))}
                        className="flex-1 py-2.5 text-xs font-semibold"
                        style={{
                          background: form.status === s ? "#2B4030" : "transparent",
                          color: form.status === s ? "#F5EFE5" : "#5C5C56",
                          borderRadius: 99,
                          border: form.status === s ? "none" : "0.5px solid #E5DDD0",
                        }}>
                        {STATUS_CFG[s].label}
                      </button>
                    ))}
                  </div>
                </NieuwField>

                <NieuwField label="Labels">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(LABEL_CFG) as Label[]).map((l) => {
                      const cfg = LABEL_CFG[l];
                      const active = (form.labels ?? []).includes(l);
                      return (
                        <button key={l} onClick={() => toggleLabel(l)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                          style={{
                            background: active ? "#2B4030" : "transparent",
                            color: active ? "#F5EFE5" : "#5C5C56",
                            borderRadius: 99,
                            border: active ? "none" : "0.5px solid #E5DDD0",
                          }}>
                          {cfg.icon} {cfg.naam}
                        </button>
                      );
                    })}
                  </div>
                </NieuwField>

                <NieuwField label="Bron">
                  <div className="flex gap-2 flex-wrap">
                    {["Servr", "WhatsApp", "Aanbeveling", "Google", "Overig"].map((b) => (
                      <button key={b} onClick={() => setForm((f) => ({ ...f, bron: b }))}
                        className="px-3 py-2 text-xs font-semibold"
                        style={{
                          background: form.bron === b ? "#2B4030" : "transparent",
                          color: form.bron === b ? "#F5EFE5" : "#5C5C56",
                          borderRadius: 99,
                          border: form.bron === b ? "none" : "0.5px solid #E5DDD0",
                        }}>
                        {b}
                      </button>
                    ))}
                  </div>
                </NieuwField>

                <NieuwField label="Beoordeling">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} onClick={() => setForm((f) => ({ ...f, rating: r }))}
                        className="flex-1 py-2.5 flex items-center justify-center">
                        <Star size={20} fill={r <= (form.rating ?? 0) ? "#C97A4D" : "none"}
                          style={{ color: r <= (form.rating ?? 0) ? "#C97A4D" : "#E5DDD0" }} />
                      </button>
                    ))}
                  </div>
                </NieuwField>

                <button onClick={saveNieuw} disabled={!form.naam}
                  className="w-full py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
                  <Plus size={17} />
                  Klant opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function NieuwField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#8A8A83" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
