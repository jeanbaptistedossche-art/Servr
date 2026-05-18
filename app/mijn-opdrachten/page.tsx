"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, ChevronRight, Clock, CheckCircle, Euro, CreditCard } from "lucide-react";
import { MOCK_OPDRACHTEN } from "@/lib/store";
import { useOfferteStore } from "@/lib/offerteStore";

const STATUS_CONFIG = {
  open: { label: "Wacht op offertes", color: "#d97706", bg: "#fef3c7", icon: "⏳" },
  offerte_ontvangen: { label: "Offerte ontvangen!", color: "var(--teal)", bg: "var(--teal)" + "15", icon: "📬" },
  geaccepteerd: { label: "Vakman gekozen", color: "#7c3aed", bg: "#ede9fe", icon: "✅" },
  betaald: { label: "Betaald — in uitvoering", color: "var(--teal)", bg: "var(--teal)" + "10", icon: "💳" },
  afgerond: { label: "Afgerond", color: "#16a34a", bg: "#dcfce7", icon: "🏁" },
};

function OpdrachtKaart({ o, highlight }: { o: typeof MOCK_OPDRACHTEN[0]; highlight?: boolean }) {
  const cfg = STATUS_CONFIG[o.status];
  return (
    <div className={`card overflow-hidden ${highlight ? "ring-2" : ""}`}
      style={{ ["--tw-ring-color" as string]: "var(--teal)" }}>
      {highlight && (
        <div className="py-1.5 text-center text-xs font-black"
          style={{ background: "var(--teal)", color: "white" }}>
          🎉 Nieuw geplaatst!
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "var(--surface-2)" }}>
            {o.categorieIcon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{o.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              📍 {o.adres.split(",")[0]} · {o.aangemaakt}
            </p>
          </div>
          <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {o.status === "offerte_ontvangen" && (
          <Link href="/offertes"
            className="touch-scale flex items-center justify-between p-3 rounded-2xl mb-3"
            style={{ background: "var(--teal)" + "12" }}>
            <span className="text-sm font-bold" style={{ color: "var(--teal)" }}>
              2 offertes ontvangen — bekijk nu
            </span>
            <ChevronRight size={16} style={{ color: "var(--teal)" }} />
          </Link>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Euro size={13} />
            <span className="text-xs">{o.budget}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Clock size={13} />
            <span className="text-xs capitalize">{o.urgentie === "hoog" ? "Spoed" : o.urgentie}</span>
          </div>
          <div className="ml-auto">
            {o.status === "offerte_ontvangen" ? (
              <Link href="/offertes"
                className="touch-scale text-xs font-bold px-3 py-1.5 rounded-full text-white"
                style={{ background: "var(--teal)" }}>
                Bekijk offertes
              </Link>
            ) : o.status === "open" ? (
              <span className="text-xs" style={{ color: "var(--muted)" }}>Wacht op reacties...</span>
            ) : (
              <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Details →</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Content() {
  const searchParams = useSearchParams();
  const isNieuw = searchParams.get("nieuw") === "1";
  const { offertes } = useOfferteStore();
  const openstaandeBetalingen = offertes.filter(o => o.status === "openstaand");

  const actief = MOCK_OPDRACHTEN.filter(o => o.status !== "afgerond");
  const afgerond = MOCK_OPDRACHTEN.filter(o => o.status === "afgerond");

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <h1 className="text-white font-black text-2xl mb-1">Mijn Opdrachten</h1>
        <p className="text-white/70 text-sm">Beheer al jouw klussen</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Actief", value: "3", icon: "⚡" },
            { label: "Offertes", value: "2", icon: "📬" },
            { label: "Afgerond", value: "11", icon: "✅" },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-white text-xl font-black">{s.icon} {s.value}</p>
              <p className="text-white/70 text-[11px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* ── Te betalen banner ── */}
        {openstaandeBetalingen.length > 0 && (
          <Link href="/te-betalen"
            className="touch-scale flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CreditCard size={22} color="white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-sm">
                {openstaandeBetalingen.length === 1 ? "1 offerte te betalen" : `${openstaandeBetalingen.length} offertes te betalen`}
              </p>
              <p className="text-white/70 text-xs">Tik om te bekijken en te betalen</p>
            </div>
            <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
          </Link>
        )}

        {/* Nieuwe opdracht */}
        <Link href="/opdracht/nieuw"
          className="touch-scale flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Plus size={26} color="white" />
          </div>
          <div>
            <p className="text-white font-black text-base">Nieuwe opdracht</p>
            <p className="text-white/70 text-xs">Foto uploaden → offertes ontvangen</p>
          </div>
          <ChevronRight size={20} color="white" className="ml-auto" />
        </Link>

        {/* Actieve opdrachten */}
        {actief.length > 0 && (
          <div>
            <p className="font-black text-base mb-3">Actief ({actief.length})</p>
            <div className="flex flex-col gap-3">
              {actief.map((o, i) => (
                <OpdrachtKaart key={o.id} o={o} highlight={isNieuw && i === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Afgerond */}
        {afgerond.length > 0 && (
          <div>
            <p className="font-black text-base mb-3">Afgerond</p>
            <div className="flex flex-col gap-3">
              {afgerond.map(o => <OpdrachtKaart key={o.id} o={o} />)}
            </div>
          </div>
        )}

        {actief.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-6xl">🔧</span>
            <p className="font-black text-lg">Nog geen opdrachten</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Plaats je eerste opdracht en ontvang offertes van vakmensen bij jou in de buurt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MijnOpdrachtenPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
