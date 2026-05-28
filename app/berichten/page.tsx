"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, PenSquare, CheckCheck } from "lucide-react";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

type Filter = "alle" | "onbeantwoord" | "archief";

type Gesprek = {
  id: string;
  naam: string;
  initial: string;
  avatarBg: string;
  klus: string;
  preview: string;
  tijd: string;
  unread?: number;
  gelezen?: boolean;
};

const GESPREKKEN: Gesprek[] = [
  {
    id: "g1",
    naam: "Anita van der Berg",
    initial: "A",
    avatarBg: "#C97A4D",
    klus: "Spoed · Lekkende kraan",
    preview: "Ik ben net thuis, wanneer kan je langskomen?",
    tijd: "14:22",
    unread: 2,
  },
  {
    id: "g2",
    naam: "Sofia Martins",
    initial: "S",
    avatarBg: "#2B4030",
    klus: "Stopcontact plaatsen 3×",
    preview: "Ik kan morgen om 9:00 langskomen, past dat?",
    tijd: "Gisteren",
    unread: 1,
  },
  {
    id: "g3",
    naam: "Kim Nguyen",
    initial: "K",
    avatarBg: "#EDE4D2",
    klus: "Offerte schilderwerk",
    preview: "De offerte is verstuurd. Neem even rustig…",
    tijd: "Ma",
    gelezen: true,
  },
  {
    id: "g4",
    naam: "Lars Visser",
    initial: "L",
    avatarBg: "#EDE4D2",
    klus: "Geiser onderhoud",
    preview: "Top, ik zie je dan dinsdag.",
    tijd: "Zo",
    gelezen: true,
  },
  {
    id: "g5",
    naam: "Yusuf Aydın",
    initial: "Y",
    avatarBg: "#EDE4D2",
    klus: "Collega-overleg",
    preview: "Kan ik een foto sturen van de meterkast?",
    tijd: "Vr",
  },
];

export default function BerichtenPage() {
  const { markBerichtenRead } = useUserStore();
  const [filter, setFilter] = useState<Filter>("alle");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    markBerichtenRead();
  }, [markBerichtenRead]);

  const onbeantwoord = GESPREKKEN.filter(g => g.unread && g.unread > 0);

  const zichtbaar = filter === "onbeantwoord"
    ? onbeantwoord
    : filter === "archief"
      ? GESPREKKEN.filter(g => g.gelezen)
      : GESPREKKEN;

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>
              {onbeantwoord.length} onbeantwoord
            </p>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>
              Berichten
            </h2>
          </div>
          <button className="touch-scale" style={{
            padding: 8, background: "transparent",
            border: "0.5px solid #E5DDD0", borderRadius: 99,
            color: "#1A1D1A", cursor: "pointer", display: "flex", alignItems: "center",
          }} aria-label="Nieuw bericht">
            <PenSquare size={15} />
          </button>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 10, padding: "10px 14px", marginBottom: 14,
        }}>
          <Search size={16} style={{ color: "#8A8A83", flexShrink: 0 }} />
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#8A8A83", flex: 1 }}>
            Zoek in gesprekken…
          </span>
        </div>

        {/* Filter chips */}
        <div style={{
          display: "flex", gap: 6,
          paddingBottom: 12, borderBottom: "0.5px solid #E5DDD0",
        }}>
          {([
            { key: "alle",         label: "Alle" },
            { key: "onbeantwoord", label: `Onbeantwoord ·${onbeantwoord.length}` },
            { key: "archief",      label: "Archief" },
          ] as { key: Filter; label: string }[]).map(f => (
            <button
              key={f.key}
              className="touch-scale"
              onClick={() => setFilter(f.key)}
              style={{
                fontSize: 11, padding: "5px 11px",
                background: filter === f.key ? "#1A1D1A" : "transparent",
                color: filter === f.key ? "#F5EFE5" : "#5C5C56",
                border: filter === f.key ? "none" : "0.5px solid #E5DDD0",
                borderRadius: 99, cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontWeight: filter === f.key ? 500 : 400,
              }}
            >
              {f.key === "onbeantwoord"
                ? <>Onbeantwoord <span style={{ color: filter === f.key ? "#F5EFE5" : "#C97A4D" }}>·{onbeantwoord.length}</span></>
                : f.label
              }
            </button>
          ))}
        </div>
      </div>

      {/* ── Conversation list ── */}
      <div className="px-5 pb-28">
        {zichtbaar.map((g, i) => {
          const isUnread = !!(g.unread && g.unread > 0);
          const avatarColor = g.avatarBg === "#EDE4D2" ? "#1A1D1A" : (g.avatarBg === "#C97A4D" ? "#1A1D1A" : "#F5EFE5");

          return (
            <Link
              key={g.id}
              href={`/chat/${g.id}`}
              className="touch-scale"
              style={{
                display: "flex", gap: 12, padding: "12px 0",
                alignItems: "center",
                borderTop: i > 0 ? "0.5px solid #E5DDD0" : "none",
                textDecoration: "none",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: g.avatarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: SERIF, fontSize: 17, color: avatarColor,
                flexShrink: 0,
              }}>
                {g.initial}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{
                    fontSize: 14, fontWeight: isUnread ? 500 : 400,
                    margin: 0, color: isUnread ? "#1A1D1A" : "#5C5C56",
                  }}>{g.naam}</p>
                  <span style={{
                    fontSize: 11,
                    color: isUnread ? "#C97A4D" : "#8A8A83",
                    fontWeight: isUnread ? 500 : 400,
                    flexShrink: 0, marginLeft: 8,
                  }}>{g.tijd}</span>
                </div>
                <p style={{
                  fontFamily: SERIF, fontStyle: "italic",
                  fontSize: 11, color: "#8A8A83", margin: "1px 0 2px",
                }}>{g.klus}</p>
                <p style={{
                  fontSize: 12, color: g.gelezen ? "#8A8A83" : "#1A1D1A",
                  margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {g.gelezen && <CheckCheck size={11} style={{ color: "#2B4030", flexShrink: 0 }} />}
                  {g.preview}
                </p>
              </div>

              {/* Unread badge */}
              {isUnread && (
                <span style={{
                  background: "#C97A4D", color: "#1A1D1A",
                  fontSize: 10, fontWeight: 500,
                  padding: "2px 6px", borderRadius: 99,
                  minWidth: 18, textAlign: "center",
                  flexShrink: 0,
                }}>
                  {g.unread}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
