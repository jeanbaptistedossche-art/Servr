"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Search, Star, Phone, Mail,
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
  rating: number;        // 1-5 stars given by vakman
  aangemaakt: string;    // ISO date
  laatsActief: string;   // ISO date
  jobs: KlantJob[];
  notities: Notitie[];
  bron?: string;         // "Servr" | "WhatsApp" | "Aanbeveling" | "Google"
};

// ─── Label config ─────────────────────────────────────────────────────────────
const LABEL_CFG: Record<Label, { naam: string; kleur: string; bg: string; icon: string }> = {
  vip:           { naam: "VIP",          kleur: "#F59E0B", bg: "#FFFBEB", icon: "👑" },
  snel_betaler:  { naam: "Snelle betaler", kleur: "#10B981", bg: "#ECFDF5", icon: "⚡" },
  moeilijk:      { naam: "Moeilijk",     kleur: "#EF4444", bg: "#FEF2F2", icon: "⚠️" },
  aanbevolen:    { naam: "Aanbevolen",   kleur: "#8B5CF6", bg: "#F5F3FF", icon: "🌟" },
  nieuw:         { naam: "Nieuw",        kleur: "#0EA5E9", bg: "#F0F9FF", icon: "✨" },
};

const STATUS_CFG: Record<KlantStatus, { label: string; kleur: string; bg: string }> = {
  actief:    { label: "Actief",    kleur: "#10B981", bg: "#ECFDF5" },
  inactief:  { label: "Inactief",  kleur: "#94a3b8", bg: "#F1F5F9" },
  prospect:  { label: "Prospect",  kleur: "#F59E0B", bg: "#FFFBEB" },
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
        <Star key={i} size={12} fill={i < n ? "#F59E0B" : "none"} style={{ color: i < n ? "#F59E0B" : "#D1D5DB" }} />
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

  // New klant form
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
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Klantenbestand</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>{klanten.length} contacten · CRM</p>
          </div>
          <button onClick={() => setShowNieuw(true)}
            className="touch-scale flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm text-white"
            style={{ background: "#4F46E5" }}>
            <Plus size={16} />
            Nieuw
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 mb-3"
          style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Search size={16} style={{ color: "#94a3b8" }} />
          <input value={zoek} onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op naam, email, telefoon…"
            className="flex-1 text-sm bg-transparent"
            style={{ color: "#0f172a", outline: "none" }} />
        </div>

        {/* Filter + sort row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
            {(["alle", "actief", "inactief", "prospect"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold capitalize"
                style={{
                  background: statusFilter === s ? "#4F46E5" : "#fff",
                  color: statusFilter === s ? "#fff" : "#64748b",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                {s === "alle" ? "Alles" : STATUS_CFG[s as KlantStatus]?.label ?? s}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="flex-shrink-0 rounded-2xl px-3 py-2 text-xs font-bold appearance-none"
            style={{ background: "#fff", color: "#64748b", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "none" }}>
            <option value="recent">Recent</option>
            <option value="omzet">Omzet</option>
            <option value="naam">Naam</option>
          </select>
        </div>
      </div>

      <div className="px-4 pb-28 mt-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Users size={16} style={{ color: "#4F46E5" }} />
            <p className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>{actiefCount}</p>
            <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Actief</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <TrendingUp size={16} style={{ color: "#10B981" }} />
            <p className="font-black text-lg leading-tight" style={{ color: "#0f172a" }}>
              {fmtEur(totaleOmzet)}
            </p>
            <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Totale omzet</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: openstaandTotaal > 0 ? "#FFFBEB" : "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Euro size={16} style={{ color: openstaandTotaal > 0 ? "#F59E0B" : "#94a3b8" }} />
            <p className="font-black text-lg leading-tight"
              style={{ color: openstaandTotaal > 0 ? "#D97706" : "#0f172a" }}>
              {fmtEur(openstaandTotaal)}
            </p>
            <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Openstaand</p>
          </div>
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl p-8 text-center"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <p className="text-3xl mb-2">👥</p>
            <p className="font-bold" style={{ color: "#0f172a" }}>Geen klanten gevonden</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>Pas de filter aan of voeg een nieuwe klant toe</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((k) => {
              const omzet = totalOmzet(k);
              const open = openstaand(k);
              const statusCfg = STATUS_CFG[k.status];
              return (
                <button key={k.id} onClick={() => { setShowDetail(k); setDetailTab("overzicht"); }}
                  className="touch-scale w-full rounded-2xl p-4 text-left"
                  style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <img src={k.avatar} alt={k.naam}
                      className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
                      style={{ border: "2px solid #E2E8F0" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{k.naam}</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: statusCfg.bg, color: statusCfg.kleur }}>
                          {statusCfg.label}
                        </span>
                      </div>
                      {/* Labels */}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {k.labels.map((l) => (
                          <span key={l} className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: LABEL_CFG[l].bg, color: LABEL_CFG[l].kleur }}>
                            {LABEL_CFG[l].icon}
                          </span>
                        ))}
                        {k.rating > 0 && <Stars n={k.rating} />}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>
                        {k.jobs.length} klus{k.jobs.length !== 1 ? "sen" : ""} · {k.bron ?? "Servr"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: "#10B981" }}>{fmtEur(omzet)}</p>
                      {open > 0 && <p className="text-xs font-bold" style={{ color: "#F59E0B" }}>{fmtEur(open)} open</p>}
                      <ChevronRight size={14} style={{ color: "#CBD5E1", marginLeft: "auto" }} />
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
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDetail(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden max-h-[92dvh] flex flex-col"
            style={{ background: "#F1F4FA" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Handle + header */}
            <div className="px-5 pt-4 pb-3 flex-shrink-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#CBD5E1" }} />
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <img src={showDetail.avatar} alt={showDetail.naam}
                  className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: "2px solid #E2E8F0" }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>{showDetail.naam}</h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: STATUS_CFG[showDetail.status].bg, color: STATUS_CFG[showDetail.status].kleur }}>
                      {STATUS_CFG[showDetail.status].label}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap items-center">
                    {showDetail.labels.map((l) => (
                      <span key={l} className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: LABEL_CFG[l].bg, color: LABEL_CFG[l].kleur }}>
                        {LABEL_CFG[l].icon} {LABEL_CFG[l].naam}
                      </span>
                    ))}
                    {showDetail.rating > 0 && <Stars n={showDetail.rating} />}
                  </div>
                </div>
                <button onClick={() => setShowDetail(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#E2E8F0" }}>
                  <X size={16} style={{ color: "#6B7280" }} />
                </button>
              </div>

              {/* Quick contact */}
              <div className="flex gap-2">
                {showDetail.telefoon && (
                  <a href={`tel:${showDetail.telefoon}`}
                    className="touch-scale flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: "#fff", color: "#4F46E5" }}>
                    <Phone size={14} />
                    Bellen
                  </a>
                )}
                {showDetail.email && (
                  <a href={`mailto:${showDetail.email}`}
                    className="touch-scale flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: "#fff", color: "#4F46E5" }}>
                    <Mail size={14} />
                    Mail
                  </a>
                )}
                <button
                  className="touch-scale flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: "#25D366", color: "#fff" }}>
                  <MessageCircle size={14} />
                  Chat
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-2xl mt-3" style={{ background: "#E2E8F0" }}>
                {(["overzicht", "jobs", "notities"] as const).map((t) => (
                  <button key={t} onClick={() => setDetailTab(t)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold capitalize"
                    style={{
                      background: detailTab === t ? "#fff" : "transparent",
                      color: detailTab === t ? "#4F46E5" : "#64748b",
                      boxShadow: detailTab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                    }}>
                    {t}
                    {t === "notities" && showDetail.notities.length > 0 && (
                      <span className="ml-1 text-xs" style={{ color: "#94a3b8" }}>({showDetail.notities.length})</span>
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
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl p-3" style={{ background: "#fff" }}>
                      <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Totale omzet</p>
                      <p className="font-black text-xl" style={{ color: "#10B981" }}>{fmtEur(totalOmzet(showDetail))}</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: "#fff" }}>
                      <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Klussen</p>
                      <p className="font-black text-xl" style={{ color: "#4F46E5" }}>{showDetail.jobs.length}</p>
                    </div>
                    {openstaand(showDetail) > 0 && (
                      <div className="rounded-2xl p-3" style={{ background: "#FFFBEB" }}>
                        <p className="text-xs font-semibold" style={{ color: "#D97706" }}>Openstaand</p>
                        <p className="font-black text-xl" style={{ color: "#D97706" }}>{fmtEur(openstaand(showDetail))}</p>
                      </div>
                    )}
                    <div className="rounded-2xl p-3" style={{ background: "#fff" }}>
                      <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Klant sinds</p>
                      <p className="font-black text-sm" style={{ color: "#0f172a" }}>
                        {new Date(showDetail.aangemaakt).toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Contact info */}
                  {(showDetail.telefoon || showDetail.email || showDetail.adres) && (
                    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "#fff" }}>
                      {showDetail.telefoon && (
                        <div className="flex items-center gap-3">
                          <Phone size={14} style={{ color: "#94a3b8" }} />
                          <p className="text-sm" style={{ color: "#374151" }}>{showDetail.telefoon}</p>
                        </div>
                      )}
                      {showDetail.email && (
                        <div className="flex items-center gap-3">
                          <Mail size={14} style={{ color: "#94a3b8" }} />
                          <p className="text-sm truncate" style={{ color: "#374151" }}>{showDetail.email}</p>
                        </div>
                      )}
                      {showDetail.adres && (
                        <div className="flex items-center gap-3">
                          <MapPin size={14} style={{ color: "#94a3b8" }} />
                          <p className="text-sm" style={{ color: "#374151" }}>{showDetail.adres}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Source */}
                  {showDetail.bron && (
                    <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ background: "#EEF2FF" }}>
                      <Tag size={14} style={{ color: "#4F46E5" }} />
                      <p className="text-sm font-semibold" style={{ color: "#4F46E5" }}>
                        Gevonden via: {showDetail.bron}
                      </p>
                    </div>
                  )}

                  {/* Delete */}
                  <button onClick={() => deleteKlant(showDetail.id)}
                    className="touch-scale w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: "#FEF2F2", color: "#EF4444" }}>
                    <Trash2 size={16} />
                    Klant verwijderen
                  </button>
                </div>
              )}

              {/* JOBS */}
              {detailTab === "jobs" && (
                <div className="flex flex-col gap-2 mt-3">
                  {showDetail.jobs.length === 0 ? (
                    <div className="rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
                      <p className="text-2xl mb-2">🔧</p>
                      <p className="font-bold" style={{ color: "#0f172a" }}>Nog geen klussen</p>
                    </div>
                  ) : showDetail.jobs.map((job, i) => (
                    <div key={i} className="rounded-2xl p-4 flex items-center gap-3"
                      style={{ background: "#fff" }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: job.status === "betaald" ? "#10B981" : job.status === "openstaand" ? "#F59E0B" : "#94a3b8" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>{job.omschrijving}</p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>
                          {new Date(job.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{fmtEur(job.bedrag)}</p>
                        <p className="text-xs font-semibold"
                          style={{ color: job.status === "betaald" ? "#10B981" : job.status === "openstaand" ? "#F59E0B" : "#94a3b8" }}>
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
                  {/* Add note */}
                  {!showNotitiInput ? (
                    <button onClick={() => setShowNotitiInput(true)}
                      className="touch-scale w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                      <Plus size={16} />
                      Notitie toevoegen
                    </button>
                  ) : (
                    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "#fff" }}>
                      <textarea value={newNotitie} onChange={(e) => setNewNotitie(e.target.value)}
                        placeholder="Schrijf een notitie over deze klant…"
                        rows={3} autoFocus
                        className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
                        style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowNotitiInput(false); setNewNotitie(""); }}
                          className="touch-scale flex-1 py-2.5 rounded-xl font-bold text-sm"
                          style={{ background: "#F3F4F6", color: "#64748b" }}>
                          Annuleer
                        </button>
                        <button onClick={addNotitie}
                          className="touch-scale flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                          style={{ background: "#4F46E5" }}>
                          Opslaan
                        </button>
                      </div>
                    </div>
                  )}

                  {showDetail.notities.length === 0 && !showNotitiInput ? (
                    <div className="rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
                      <StickyNote size={28} style={{ color: "#CBD5E1", margin: "0 auto 8px" }} />
                      <p className="font-bold" style={{ color: "#0f172a" }}>Nog geen notities</p>
                      <p className="text-sm mt-1" style={{ color: "#64748b" }}>Voeg notities toe over afspraken, voorkeuren, etc.</p>
                    </div>
                  ) : showDetail.notities.map((n) => (
                    <div key={n.id} className="rounded-2xl p-4" style={{ background: "#fff" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>{n.datum}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{n.tekst}</p>
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
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowNieuw(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>Nieuwe klant</h2>
                <button onClick={() => setShowNieuw(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F3F4F6" }}>
                  <X size={16} style={{ color: "#6B7280" }} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Naam */}
                <NieuwField label="Naam *">
                  <input value={form.naam ?? ""} onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))}
                    placeholder="Volledige naam…" autoFocus
                    className="w-full rounded-2xl px-4 py-3.5 text-sm"
                    style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                </NieuwField>

                {/* Email + tel */}
                <div className="grid grid-cols-2 gap-3">
                  <NieuwField label="Email">
                    <input type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="email@…"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                  </NieuwField>
                  <NieuwField label="Telefoon">
                    <input type="tel" value={form.telefoon ?? ""} onChange={(e) => setForm((f) => ({ ...f, telefoon: e.target.value }))}
                      placeholder="06-…"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                  </NieuwField>
                </div>

                {/* Adres */}
                <NieuwField label="Adres">
                  <input value={form.adres ?? ""} onChange={(e) => setForm((f) => ({ ...f, adres: e.target.value }))}
                    placeholder="Straat + huisnummer, Stad…"
                    className="w-full rounded-2xl px-4 py-3.5 text-sm"
                    style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                </NieuwField>

                {/* Status */}
                <NieuwField label="Status">
                  <div className="flex gap-2">
                    {(["actief", "prospect", "inactief"] as KlantStatus[]).map((s) => (
                      <button key={s} onClick={() => setForm((f) => ({ ...f, status: s }))}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                        style={{
                          background: form.status === s ? STATUS_CFG[s].kleur : "#F3F4F6",
                          color: form.status === s ? "#fff" : "#64748b",
                        }}>
                        {STATUS_CFG[s].label}
                      </button>
                    ))}
                  </div>
                </NieuwField>

                {/* Labels */}
                <NieuwField label="Labels">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(LABEL_CFG) as Label[]).map((l) => {
                      const cfg = LABEL_CFG[l];
                      const active = (form.labels ?? []).includes(l);
                      return (
                        <button key={l} onClick={() => toggleLabel(l)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                          style={{
                            background: active ? cfg.kleur : "#F3F4F6",
                            color: active ? "#fff" : "#64748b",
                          }}>
                          {cfg.icon} {cfg.naam}
                        </button>
                      );
                    })}
                  </div>
                </NieuwField>

                {/* Bron */}
                <NieuwField label="Bron">
                  <div className="flex gap-2 flex-wrap">
                    {["Servr", "WhatsApp", "Aanbeveling", "Google", "Overig"].map((b) => (
                      <button key={b} onClick={() => setForm((f) => ({ ...f, bron: b }))}
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style={{
                          background: form.bron === b ? "#4F46E5" : "#F3F4F6",
                          color: form.bron === b ? "#fff" : "#64748b",
                        }}>
                        {b}
                      </button>
                    ))}
                  </div>
                </NieuwField>

                {/* Rating */}
                <NieuwField label="Beoordeling">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} onClick={() => setForm((f) => ({ ...f, rating: r }))}
                        className="flex-1 py-2.5 rounded-xl flex items-center justify-center">
                        <Star size={20} fill={r <= (form.rating ?? 0) ? "#F59E0B" : "none"}
                          style={{ color: r <= (form.rating ?? 0) ? "#F59E0B" : "#D1D5DB" }} />
                      </button>
                    ))}
                  </div>
                </NieuwField>

                <button onClick={saveNieuw} disabled={!form.naam}
                  className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "#4F46E5" }}>
                  <Plus size={18} />
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
      <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
