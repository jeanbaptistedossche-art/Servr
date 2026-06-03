"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, ChevronRight } from "lucide-react";
import { supabase, supabaseReady } from "@/lib/supabase";
import { useUserStore } from "@/lib/store";

type OfferteRow = {
  id: string;
  prijs: number;
  omschrijving: string;
  eta: string | null;
  status: string;
  created_at: string;
  opdracht: {
    titel: string;
    categorie: string | null;
    adres: string | null;
    klant: { name: string } | null;
  } | null;
};

type FilterKey = "alle" | "wachtend" | "geaccepteerd" | "geweigerd";

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: "alle",        label: "Alle" },
  { key: "wachtend",    label: "Wachtend" },
  { key: "geaccepteerd",label: "Geaccepteerd" },
  { key: "geweigerd",   label: "Geweigerd" },
];

function statusBadge(status: string) {
  switch (status) {
    case "geaccepteerd": return { label: "Geaccepteerd", color: "#2B4030", bg: "#E8EDE9" };
    case "geweigerd":    return { label: "Geweigerd",    color: "#8A8A83", bg: "#F0EDE8" };
    default:             return { label: "Wachtend",     color: "#C97A4D", bg: "#F7EDE4" };
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function OffertesPage() {
  const router = useRouter();
  const { userId: storeUserId } = useUserStore();
  const [userId, setUserId] = useState(storeUserId);
  const [offertes, setOffertes] = useState<OfferteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("alle");

  // userId fallback
  useEffect(() => {
    if (storeUserId) { setUserId(storeUserId); return; }
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, [storeUserId]);

  // Load offertes
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    (supabase.from("offertes") as any)
      .select("*, opdracht:opdrachten(titel, categorie, adres, klant_id, klant:profiles!opdrachten_klant_id_fkey(name))")
      .eq("vakman_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: OfferteRow[] | null }) => {
        setOffertes(data ?? []);
        setLoading(false);
      });
  }, [userId]);

  const totaal      = offertes.length;
  const wachtend    = offertes.filter(o => o.status !== "geaccepteerd" && o.status !== "geweigerd").length;
  const geaccepteerd = offertes.filter(o => o.status === "geaccepteerd").length;

  const visible = offertes.filter(o => {
    if (filter === "alle")         return true;
    if (filter === "wachtend")     return o.status !== "geaccepteerd" && o.status !== "geweigerd";
    if (filter === "geaccepteerd") return o.status === "geaccepteerd";
    if (filter === "geweigerd")    return o.status === "geweigerd";
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>

      {/* Sticky Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Mijn offertes
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>{totaal} verstuurd</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { value: totaal,       label: "Totaal" },
            { value: wachtend,     label: "Wachtend" },
            { value: geaccepteerd, label: "Geaccepteerd" },
          ].map((s, i) => (
            <div key={i} className="p-3 text-center"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <p className="font-black text-lg"
                style={{ color: i === 2 ? "#2B4030" : i === 1 ? "#C97A4D" : "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                {s.value}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8A8A83" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className="flex-shrink-0 px-4 py-1.5 text-sm font-semibold"
              style={{
                borderRadius: 99,
                background: filter === chip.key ? "#2B4030" : "#FBF7F0",
                color: filter === chip.key ? "#F5EFE5" : "#5C5C56",
                border: filter === chip.key ? "none" : "0.5px solid #E5DDD0",
              }}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-28 mt-4 flex flex-col gap-3">

        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#2B4030", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "#8A8A83" }}>Offertes laden…</p>
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <span className="text-5xl">📋</span>
            <p className="font-semibold text-base" style={{ color: "#1A1D1A" }}>
              {filter === "alle" ? "Nog geen offertes verstuurd" : `Geen ${filter} offertes`}
            </p>
            <p className="text-sm" style={{ color: "#8A8A83" }}>
              {filter === "alle"
                ? "Je hebt nog geen offertes uitgebracht op opdrachten."
                : "Probeer een ander filter."}
            </p>
          </div>
        )}

        {!loading && visible.map(off => {
          const badge = statusBadge(off.status);
          const klantNaam = off.opdracht?.klant?.name ?? "Onbekende klant";
          const titel = off.opdracht?.titel ?? "Opdracht";
          return (
            <div key={off.id}
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: "#1A1D1A" }}>{titel}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>{klantNaam}</p>
                </div>
                <span className="flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              </div>

              {/* Omschrijving */}
              {off.omschrijving && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#5C5C56" }}>
                  {off.omschrijving}
                </p>
              )}

              {/* Meta row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs" style={{ color: "#8A8A83" }}>
                  {off.eta && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{off.eta}</span>
                    </div>
                  )}
                  {off.status === "geaccepteerd" && (
                    <div className="flex items-center gap-1">
                      <CheckCircle size={12} style={{ color: "#2B4030" }} />
                      <span style={{ color: "#2B4030" }}>Geaccepteerd</span>
                    </div>
                  )}
                  <span>{fmtDate(off.created_at)}</span>
                </div>
                <p className="font-bold text-xl flex-shrink-0"
                  style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  €{off.prijs}
                </p>
              </div>

              {/* Detail link */}
              <button
                onClick={() => router.push(`/offerte/${off.id}`)}
                className="w-full mt-3 h-10 font-semibold text-sm flex items-center justify-center gap-1"
                style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
                Bekijken <ChevronRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
