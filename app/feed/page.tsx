"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock } from "lucide-react";
import { supabase, supabaseReady } from "@/lib/supabase";

type Opdracht = {
  id: string;
  klant_id: string;
  titel: string;
  beschrijving: string;
  categorie: string;
  adres: string;
  urgentie: string;
  budget: number | null;
  status: string;
  created_at: string;
};

const FILTERS = ["Alle", "Loodgieter", "Elektricien", "Schilder", "Schoonmaak", "Timmerman", "Overig"];

const CAT_EMOJI: Record<string, string> = {
  Loodgieter: "🔧",
  Elektricien: "⚡",
  Schilder: "🖌️",
  Schoonmaak: "🧹",
  Timmerman: "🪚",
};

function getEmoji(categorie: string): string {
  return CAT_EMOJI[categorie] ?? "🔨";
}

function tijdGeleden(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min}m geleden`;
  const uur = Math.floor(min / 60);
  if (uur < 24) return `${uur}u geleden`;
  return `${Math.floor(uur / 24)}d geleden`;
}

function UrgentieBadge({ urgentie }: { urgentie: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    hoog: { label: "Urgent", color: "#C97A4D", bg: "#F5EDE5" },
    middel: { label: "Normaal", color: "#8A8A83", bg: "#F0EDEA" },
    laag: { label: "Flexibel", color: "#2B4030", bg: "#EAF0EC" },
  };
  const s = map[urgentie] ?? map.middel;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: s.color,
        background: s.bg,
        borderRadius: 6,
        padding: "2px 8px",
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
}

function JobCard({ o, onOfferte }: { o: Opdracht; onOfferte: () => void }) {
  const emoji = getEmoji(o.categorie);

  return (
    <div
      style={{
        background: "#FBF7F0",
        border: "0.5px solid #E5DDD0",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#EAF0EC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p
              style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#1A1D1A",
                margin: 0,
                flex: 1,
                minWidth: 0,
              }}
            >
              {o.titel}
            </p>
            <UrgentieBadge urgentie={o.urgentie} />
          </div>
        </div>
      </div>

      {/* Middle */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p
          style={{
            fontSize: 13,
            color: "#8A8A83",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {o.beschrijving}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#8A8A83" }}>
            <MapPin size={11} />
            {o.adres}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#8A8A83" }}>
            <Clock size={11} />
            {tijdGeleden(o.created_at)}
          </span>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1D1A" }}>
          {o.budget != null ? `€${o.budget.toLocaleString("nl-NL")}` : "Budget n.b."}
        </span>
        <button
          onClick={onOfferte}
          style={{
            background: "#2B4030",
            color: "#F5EFE5",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Offerte sturen
        </button>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [opdrachten, setOpdrachten] = useState<Opdracht[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Alle");

  const laadOpdrachten = useCallback(async () => {
    await supabaseReady;
    const { data } = await supabase
      .from("opdrachten")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    setOpdrachten((data as Opdracht[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    laadOpdrachten();

    const channel = supabase
      .channel("opdrachten-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "opdrachten" },
        () => laadOpdrachten()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [laadOpdrachten]);

  const visible =
    filter === "Alle"
      ? opdrachten
      : opdrachten.filter((o) =>
          filter === "Overig"
            ? !["Loodgieter", "Elektricien", "Schilder", "Schoonmaak", "Timmerman"].includes(o.categorie)
            : o.categorie === filter
        );

  return (
    <div style={{ background: "#F5EFE5", minHeight: "100dvh" }}>
      {/* Sticky header */}
      <div
        className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <h1
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#1A1D1A",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Opdrachten
        </h1>
        <p style={{ fontSize: 13, color: "#8A8A83", margin: "2px 0 12px" }}>
          {loading ? "Laden…" : `${visible.length} beschikbaar`}
        </p>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  border: active ? "none" : "0.5px solid #E5DDD0",
                  background: active ? "#2B4030" : "#FBF7F0",
                  color: active ? "#F5EFE5" : "#1A1D1A",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-28" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "#8A8A83", fontSize: 14 }}>
            Opdrachten laden…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
            <p style={{ fontSize: 15, color: "#1A1D1A", fontWeight: 600, margin: 0 }}>Geen opdrachten</p>
            <p style={{ fontSize: 13, color: "#8A8A83", marginTop: 4 }}>Kom later terug</p>
          </div>
        ) : (
          visible.map((o) => (
            <JobCard
              key={o.id}
              o={o}
              onOfferte={() =>
                router.push(
                  `/offerte/maak?opdracht_id=${o.id}&titel=${encodeURIComponent(o.titel)}&klant_id=${o.klant_id}`
                )
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
