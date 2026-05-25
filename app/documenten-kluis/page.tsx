"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Shield, Award, FileText, AlertTriangle,
  Check, X, Upload, Calendar, ChevronRight, Search,
  Building2, Wrench, Car, Heart, Zap, Trash2,
  Eye, Download, Lock, Bell,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type DocType = "verzekering" | "certificaat" | "vergunning" | "identiteit" | "voertuig" | "overig";
type DocStatus = "geldig" | "verloopt_binnenkort" | "verlopen" | "geen_datum";

type Document = {
  id: string;
  naam: string;
  type: DocType;
  verstrekker?: string;       // verzekeraar / certificeringsinstantie
  polisnummer?: string;
  vervaldatum?: string;       // ISO date
  uitgiftedatum?: string;     // ISO date
  bedrag?: number;            // premie/jaar of dekkingsbedrag
  dekking?: string;           // "€1.000.000 aansprakelijkheid"
  bestandsnaam?: string;      // mock filename
  notitie?: string;
  herinnering?: number;       // dagen voor vervaldatum
  bestandData?: string;       // base64 mock
};

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CFG: Record<DocType, { label: string; icon: string; color: string; bg: string }> = {
  verzekering:  { label: "Verzekering",  icon: "🛡️", color: "#4F46E5", bg: "#EEF2FF" },
  certificaat:  { label: "Certificaat",  icon: "🏆", color: "#F59E0B", bg: "#FFFBEB" },
  vergunning:   { label: "Vergunning",   icon: "📋", color: "#10B981", bg: "#ECFDF5" },
  identiteit:   { label: "Identiteit",   icon: "🪪", color: "#0EA5E9", bg: "#F0F9FF" },
  voertuig:     { label: "Voertuig",     icon: "🚐", color: "#8B5CF6", bg: "#F5F3FF" },
  overig:       { label: "Overig",       icon: "📁", color: "#64748b", bg: "#F8FAFC" },
};

const STATUS_CFG: Record<DocStatus, { label: string; kleur: string; bg: string; icon: string }> = {
  geldig:              { label: "Geldig",             kleur: "#10B981", bg: "#ECFDF5", icon: "✓" },
  verloopt_binnenkort: { label: "Verloopt binnenkort",kleur: "#F59E0B", bg: "#FFFBEB", icon: "⚠️" },
  verlopen:            { label: "Verlopen!",          kleur: "#EF4444", bg: "#FEF2F2", icon: "✕" },
  geen_datum:          { label: "Geen vervaldatum",   kleur: "#94a3b8", bg: "#F1F5F9", icon: "−" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const TODAY = new Date();
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000).toISOString().slice(0, 10);

const INIT_DOCS: Document[] = [
  {
    id: "d1",
    naam: "Beroepsaansprakelijkheidsverzekering",
    type: "verzekering",
    verstrekker: "Interpolis",
    polisnummer: "BA-2024-78234",
    vervaldatum: addDays(TODAY, 187),
    uitgiftedatum: "2025-01-01",
    bedrag: 420,
    dekking: "€1.500.000 per aanspraak",
    bestandsnaam: "BA_Interpolis_2025.pdf",
    herinnering: 60,
    notitie: "Jaarlijkse verlenging. Automatisch verlengd tenzij opgezegd.",
  },
  {
    id: "d2",
    naam: "Arbeidsongeschiktheidsverzekering (AOV)",
    type: "verzekering",
    verstrekker: "Nationale Nederlanden",
    polisnummer: "AOV-543920",
    vervaldatum: addDays(TODAY, 312),
    uitgiftedatum: "2023-07-01",
    bedrag: 1800,
    dekking: "€3.500/maand bij volledige AO",
    bestandsnaam: "AOV_NN_2023.pdf",
    herinnering: 90,
  },
  {
    id: "d3",
    naam: "Gereedschapsverzekering",
    type: "verzekering",
    verstrekker: "Allianz",
    polisnummer: "GER-88712",
    vervaldatum: addDays(TODAY, 24),
    uitgiftedatum: "2025-02-01",
    bedrag: 340,
    dekking: "€15.000 gereedschap + bus",
    bestandsnaam: "Gereedschap_Allianz_2025.pdf",
    herinnering: 30,
    notitie: "Verloopt binnenkort! Vergeet niet te verlengen.",
  },
  {
    id: "d4",
    naam: "VCA Basisveiligheid",
    type: "certificaat",
    verstrekker: "SSVV",
    vervaldatum: addDays(TODAY, -45),
    uitgiftedatum: "2023-05-15",
    bestandsnaam: "VCA_Basis_2023.pdf",
    notitie: "VERLOPEN! Herexamen nodig voor werken op bouwplaatsen.",
  },
  {
    id: "d5",
    naam: "NEN 3140 Laagspanning",
    type: "certificaat",
    verstrekker: "Kiwa",
    vervaldatum: addDays(TODAY, 95),
    uitgiftedatum: "2023-11-20",
    bestandsnaam: "NEN3140_Kiwa_2023.pdf",
    herinnering: 60,
  },
  {
    id: "d6",
    naam: "Leidinggevende horecavergunning",
    type: "vergunning",
    verstrekker: "Gemeente Amsterdam",
    polisnummer: "HV-2024-001234",
    uitgiftedatum: "2024-03-01",
    bestandsnaam: "HorecaVergunning_2024.pdf",
  },
  {
    id: "d7",
    naam: "Rijbewijs B + E",
    type: "identiteit",
    verstrekker: "CBR",
    vervaldatum: addDays(TODAY, 1825),
    uitgiftedatum: "2020-06-10",
    bestandsnaam: "Rijbewijs_scan.pdf",
  },
  {
    id: "d8",
    naam: "APK bestelbus",
    type: "voertuig",
    verstrekker: "RDW",
    vervaldatum: addDays(TODAY, 12),
    uitgiftedatum: addDays(TODAY, -353),
    bestandsnaam: "APK_2025.pdf",
    herinnering: 14,
    notitie: "Ford Transit — kenteken 12-AB-34",
  },
];

type DocumentWithStatus = Document & { _status: DocStatus };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcStatus(doc: Document): DocStatus {
  if (!doc.vervaldatum) return "geen_datum";
  const dagen = Math.ceil((new Date(doc.vervaldatum).getTime() - Date.now()) / 86400000);
  if (dagen < 0) return "verlopen";
  if (dagen <= (doc.herinnering ?? 30)) return "verloopt_binnenkort";
  return "geldig";
}

function dagenTot(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DocumentenKluisPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<Document[]>(INIT_DOCS);
  const [zoek, setZoek] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocType | "alle">("alle");
  const [showDetail, setShowDetail] = useState<DocumentWithStatus | null>(null);
  const [showNieuw, setShowNieuw] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // New doc form
  const [form, setForm] = useState<Partial<Document>>({ type: "verzekering", herinnering: 30 });

  // ── Derived ─────────────────────────────────────────────────────────────────
  const withStatus = useMemo(() =>
    docs.map((d): DocumentWithStatus => ({ ...d, _status: calcStatus(d) })), [docs]);

  const alerts = useMemo(() =>
    withStatus.filter((d) => d._status === "verlopen" || d._status === "verloopt_binnenkort"), [withStatus]);

  const filtered = useMemo(() => {
    let list = withStatus;
    if (typeFilter !== "alle") list = list.filter((d) => d.type === typeFilter);
    if (zoek) {
      const q = zoek.toLowerCase();
      list = list.filter((d) =>
        d.naam.toLowerCase().includes(q) || d.verstrekker?.toLowerCase().includes(q));
    }
    return list;
  }, [withStatus, typeFilter, zoek]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const saveDoc = useCallback(() => {
    if (!form.naam) return;
    const doc: Document = {
      id: `d${Date.now()}`,
      naam: form.naam,
      type: form.type ?? "overig",
      verstrekker: form.verstrekker,
      polisnummer: form.polisnummer,
      vervaldatum: form.vervaldatum,
      uitgiftedatum: form.uitgiftedatum,
      bedrag: form.bedrag,
      dekking: form.dekking,
      herinnering: form.herinnering ?? 30,
      notitie: form.notitie,
      bestandsnaam: form.bestandsnaam,
    };
    setDocs((prev) => [doc, ...prev]);
    setForm({ type: "verzekering", herinnering: 30 });
    setShowNieuw(false);
  }, [form]);

  const deleteDoc = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setShowDetail(null);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, bestandsnaam: file.name }));
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totaalPremie = docs
    .filter((d) => d.type === "verzekering" && d.bedrag)
    .reduce((s, d) => s + (d.bedrag ?? 0), 0);

  const geldigCount  = withStatus.filter((d) => d._status === "geldig").length;
  const verlatenCount = withStatus.filter((d) => d._status === "verlopen" || d._status === "verloopt_binnenkort").length;

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
            <h1 className="text-xl font-black" style={{ color: "#0f172a" }}>Documenten kluis</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>Verzekeringen & certs</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {alerts.length > 0 && (
              <button onClick={() => setShowAlerts(true)}
                className="touch-scale relative w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#FEF2F2" }}>
                <Bell size={18} style={{ color: "#EF4444" }} />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ background: "#EF4444", fontSize: 10 }}>
                  {alerts.length}
                </span>
              </button>
            )}
            <button onClick={() => setShowNieuw(true)}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ background: "#4F46E5" }}>
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 mb-3"
          style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Search size={16} style={{ color: "#94a3b8" }} />
          <input value={zoek} onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek document of verstrekker…"
            className="flex-1 text-sm bg-transparent"
            style={{ color: "#0f172a", outline: "none" }} />
        </div>

        {/* Type filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setTypeFilter("alle")}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold"
            style={{
              background: typeFilter === "alle" ? "#4F46E5" : "#fff",
              color: typeFilter === "alle" ? "#fff" : "#64748b",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
            Alles
          </button>
          {(Object.keys(TYPE_CFG) as DocType[]).map((t) => {
            const cfg = TYPE_CFG[t];
            const active = typeFilter === t;
            return (
              <button key={t} onClick={() => setTypeFilter(t)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                style={{
                  background: active ? cfg.color : "#fff",
                  color: active ? "#fff" : "#64748b",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Lock size={16} style={{ color: "#4F46E5" }} />
            <p className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>{docs.length}</p>
            <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Documenten</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#ECFDF5", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Check size={16} style={{ color: "#10B981" }} />
            <p className="font-black text-xl leading-tight" style={{ color: "#10B981" }}>{geldigCount}</p>
            <p className="text-xs text-center" style={{ color: "#10B981" }}>Geldig</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: verlatenCount > 0 ? "#FEF2F2" : "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <AlertTriangle size={16} style={{ color: verlatenCount > 0 ? "#EF4444" : "#94a3b8" }} />
            <p className="font-black text-xl leading-tight"
              style={{ color: verlatenCount > 0 ? "#EF4444" : "#0f172a" }}>
              {verlatenCount}
            </p>
            <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Aandacht</p>
          </div>
        </div>

        {/* Premie overzicht */}
        {totaalPremie > 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <Shield size={20} style={{ color: "#4F46E5" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>
                Totale jaarlijkse premies: {fmtEur(totaalPremie)}
              </p>
              <p className="text-xs" style={{ color: "#6366F1" }}>
                ≈ {fmtEur(Math.round(totaalPremie / 12))}/maand over alle verzekeringen
              </p>
            </div>
          </div>
        )}

        {/* Document list */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl p-8 text-center"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <p className="text-3xl mb-2">📁</p>
            <p className="font-bold" style={{ color: "#0f172a" }}>Geen documenten gevonden</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>Voeg je eerste document toe</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((doc) => {
              const typeCfg = TYPE_CFG[doc.type];
              const statusCfg = STATUS_CFG[doc._status];
              const dagen = doc.vervaldatum ? dagenTot(doc.vervaldatum) : null;
              return (
                <button key={doc.id} onClick={() => setShowDetail(doc)}
                  className="touch-scale w-full rounded-2xl p-4 text-left"
                  style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: typeCfg.bg }}>
                      {typeCfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{doc.naam}</p>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>
                        {doc.verstrekker ?? "—"}
                        {doc.polisnummer ? ` · ${doc.polisnummer}` : ""}
                      </p>
                      {doc.bestandsnaam && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#CBD5E1" }}>
                          📎 {doc.bestandsnaam}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: statusCfg.bg, color: statusCfg.kleur }}>
                        {statusCfg.icon} {doc._status === "verlopen" ? "Verlopen" : doc._status === "verloopt_binnenkort" ? `${dagen}d` : "✓"}
                      </span>
                      {doc.vervaldatum && (
                        <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                          {new Date(doc.vervaldatum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Alerts sheet ────────────────────────────────────────────────────── */}
      {showAlerts && (
        <Sheet onClose={() => setShowAlerts(false)} title={`🚨 Actie vereist (${alerts.length})`}>
          <div className="flex flex-col gap-2 pb-2">
            {alerts.map((doc) => {
              const dagen = doc.vervaldatum ? dagenTot(doc.vervaldatum) : null;
              const verlopen = doc._status === "verlopen";
              return (
                <div key={doc.id} className="rounded-2xl p-4"
                  style={{ background: verlopen ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${verlopen ? "#FECACA" : "#FDE68A"}` }}>
                  <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{doc.naam}</p>
                  <p className="text-xs mt-0.5" style={{ color: verlopen ? "#EF4444" : "#D97706" }}>
                    {verlopen ? `Verlopen ${Math.abs(dagen ?? 0)} dagen geleden` : `Verloopt over ${dagen} dagen`}
                    {doc.vervaldatum ? ` · ${fmtDate(doc.vervaldatum)}` : ""}
                  </p>
                  {doc.verstrekker && (
                    <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Verstrekker: {doc.verstrekker}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Sheet>
      )}

      {/* ── Document detail sheet ────────────────────────────────────────────── */}
      {showDetail && (
        <Sheet onClose={() => setShowDetail(null)} title="">
          <div className="flex flex-col gap-4 pb-2">
            {/* Type + naam */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: TYPE_CFG[showDetail.type].bg }}>
                {TYPE_CFG[showDetail.type].icon}
              </div>
              <div>
                <p className="font-black text-lg leading-tight" style={{ color: "#0f172a" }}>{showDetail.naam}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: STATUS_CFG[showDetail._status].bg, color: STATUS_CFG[showDetail._status].kleur }}>
                  {STATUS_CFG[showDetail._status].label}
                </span>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2">
              {showDetail.verstrekker && <DField label="Verstrekker" value={showDetail.verstrekker} />}
              {showDetail.polisnummer && <DField label="Polisnummer" value={showDetail.polisnummer} />}
              {showDetail.uitgiftedatum && <DField label="Uitgifte" value={fmtDate(showDetail.uitgiftedatum)} />}
              {showDetail.vervaldatum && (
                <DField label="Vervaldatum" value={fmtDate(showDetail.vervaldatum)}
                  accent={showDetail._status === "verlopen" ? "#EF4444" : showDetail._status === "verloopt_binnenkort" ? "#D97706" : undefined} />
              )}
              {showDetail.bedrag && <DField label="Premie/jaar" value={fmtEur(showDetail.bedrag)} accent="#10B981" />}
              {showDetail.dekking && <DField label="Dekking" value={showDetail.dekking} />}
              {showDetail.herinnering && <DField label="Herinnering" value={`${showDetail.herinnering} dagen van tevoren`} />}
            </div>

            {/* Vervaldatum countdown */}
            {showDetail.vervaldatum && (
              <div className="rounded-2xl p-4 flex items-center justify-between"
                style={{
                  background: showDetail._status === "verlopen" ? "#FEF2F2"
                    : showDetail._status === "verloopt_binnenkort" ? "#FFFBEB"
                    : "#ECFDF5",
                }}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} style={{ color: STATUS_CFG[showDetail._status].kleur }} />
                  <p className="text-sm font-semibold" style={{ color: STATUS_CFG[showDetail._status].kleur }}>
                    {showDetail._status === "verlopen"
                      ? `Verlopen ${Math.abs(dagenTot(showDetail.vervaldatum))} dagen geleden`
                      : showDetail._status === "verloopt_binnenkort"
                        ? `Verloopt over ${dagenTot(showDetail.vervaldatum)} dagen`
                        : `Nog ${dagenTot(showDetail.vervaldatum)} dagen geldig`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Bestand */}
            {showDetail.bestandsnaam && (
              <div className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#F8FAFC" }}>
                <FileText size={18} style={{ color: "#4F46E5" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>{showDetail.bestandsnaam}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Opgeslagen document</p>
                </div>
                <button className="touch-scale w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#EEF2FF" }}>
                  <Eye size={16} style={{ color: "#4F46E5" }} />
                </button>
              </div>
            )}

            {/* Notitie */}
            {showDetail.notitie && (
              <div className="rounded-2xl p-3"
                style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "#D97706" }}>Notitie</p>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{showDetail.notitie}</p>
              </div>
            )}

            {/* Actions */}
            <button onClick={() => deleteDoc(showDetail.id)}
              className="touch-scale w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: "#FEF2F2", color: "#EF4444" }}>
              <Trash2 size={16} />
              Document verwijderen
            </button>
          </div>
        </Sheet>
      )}

      {/* ── Nieuw document sheet ─────────────────────────────────────────────── */}
      {showNieuw && (
        <Sheet onClose={() => setShowNieuw(false)} title="Document toevoegen">
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={handleFileUpload} />
          <div className="flex flex-col gap-4 pb-2">
            {/* Naam */}
            <NField label="Naam *">
              <input value={form.naam ?? ""} onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))}
                placeholder="Bijv. Beroepsaansprakelijkheidsverzekering…"
                className="w-full rounded-2xl px-4 py-3.5 text-sm"
                style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
            </NField>

            {/* Type */}
            <NField label="Type">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TYPE_CFG) as DocType[]).map((t) => {
                  const cfg = TYPE_CFG[t];
                  return (
                    <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                      style={{
                        background: form.type === t ? cfg.color : "#F3F4F6",
                        color: form.type === t ? "#fff" : "#64748b",
                      }}>
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </NField>

            {/* Verstrekker + polisnummer */}
            <div className="grid grid-cols-2 gap-3">
              <NField label="Verstrekker">
                <input value={form.verstrekker ?? ""} onChange={(e) => setForm((f) => ({ ...f, verstrekker: e.target.value }))}
                  placeholder="Interpolis…"
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </NField>
              <NField label="Polisnummer">
                <input value={form.polisnummer ?? ""} onChange={(e) => setForm((f) => ({ ...f, polisnummer: e.target.value }))}
                  placeholder="BA-2024-…"
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </NField>
            </div>

            {/* Datums */}
            <div className="grid grid-cols-2 gap-3">
              <NField label="Uitgiftedatum">
                <input type="date" value={form.uitgiftedatum ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, uitgiftedatum: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </NField>
              <NField label="Vervaldatum">
                <input type="date" value={form.vervaldatum ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, vervaldatum: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </NField>
            </div>

            {/* Premie + dekking */}
            <div className="grid grid-cols-2 gap-3">
              <NField label="Premie/jaar (€)">
                <input type="number" value={form.bedrag ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, bedrag: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="420"
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </NField>
              <NField label="Herinnering (dagen)">
                <input type="number" value={form.herinnering ?? 30}
                  onChange={(e) => setForm((f) => ({ ...f, herinnering: Number(e.target.value) }))}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </NField>
            </div>

            {/* Dekking */}
            <NField label="Dekking">
              <input value={form.dekking ?? ""} onChange={(e) => setForm((f) => ({ ...f, dekking: e.target.value }))}
                placeholder="€1.500.000 per aanspraak…"
                className="w-full rounded-2xl px-4 py-3.5 text-sm"
                style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
            </NField>

            {/* Upload */}
            <button onClick={() => fileRef.current?.click()}
              className="touch-scale w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: "#F3F4F6", color: "#374151", border: "2px dashed #CBD5E1" }}>
              <Upload size={16} />
              {form.bestandsnaam ? `📎 ${form.bestandsnaam}` : "Document uploaden (PDF/Afbeelding)"}
            </button>

            {/* Notitie */}
            <NField label="Notitie">
              <textarea value={form.notitie ?? ""} onChange={(e) => setForm((f) => ({ ...f, notitie: e.target.value }))}
                placeholder="Aanvullende informatie…" rows={2} className="w-full rounded-2xl px-4 py-3.5 text-sm resize-none"
                style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
            </NField>

            <button onClick={saveDoc} disabled={!form.naam}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: "#4F46E5" }}>
              <Lock size={18} />
              Opslaan in kluis
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Sheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden max-h-[88dvh] overflow-y-auto"
        style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-base" style={{ color: "#0f172a" }}>{title}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#F3F4F6" }}>
                <X size={16} style={{ color: "#6B7280" }} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function DField({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#F8FAFC" }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: accent ?? "#0f172a" }}>{value}</p>
    </div>
  );
}

function NField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>{label}</label>
      {children}
    </div>
  );
}
