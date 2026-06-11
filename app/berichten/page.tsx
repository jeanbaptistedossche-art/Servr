"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PenSquare, CheckCheck, X } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";
type Filter = "alle" | "onbeantwoord" | "archief";

type GesprekRij = {
  id: string;
  naam: string;
  initial: string;
  avatarBg: string;
  context: string;
  preview: string;
  tijd: string;
  unread: number;
  gelezen: boolean;
  gearchiveerd: boolean;
};

// Tijdlabel voor laatste bericht
function tijdLabel(iso: string): string {
  const d = new Date(iso);
  const nu = new Date();
  const dagVerschil = Math.floor((nu.getTime() - d.getTime()) / 86400000);
  if (dagVerschil === 0) return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  if (dagVerschil === 1) return "Gisteren";
  if (dagVerschil < 7) return d.toLocaleDateString("nl-NL", { weekday: "short" }).slice(0, 2);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

// Initialen uit naam
function initiaal(naam: string) { return naam?.charAt(0)?.toUpperCase() ?? "?"; }

// Avatar achtergrondkleuren
const AVATAR_COLORS = ["#2B4030", "#C97A4D", "#EDE4D2"];

function GesprekItem({ g, i }: { g: GesprekRij; i: number }) {
  const isUnread = g.unread > 0;
  const avatarTextColor = g.avatarBg === "#EDE4D2" ? "#1A1D1A" : g.avatarBg === "#C97A4D" ? "#1A1D1A" : "#F5EFE5";

  return (
    <Link href={`/chat/${g.id}`} style={{
      display: "flex", gap: 12, padding: "12px 0", alignItems: "center",
      borderTop: i > 0 ? "0.5px solid #E5DDD0" : "none", textDecoration: "none",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: "50%", background: g.avatarBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: SERIF, fontSize: 17, color: avatarTextColor, flexShrink: 0,
      }}>{g.initial}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <p style={{ fontSize: 14, fontWeight: isUnread ? 500 : 400, margin: 0, color: isUnread ? "#1A1D1A" : "#5C5C56" }}>{g.naam}</p>
          <span style={{ fontSize: 11, color: isUnread ? "#C97A4D" : "#8A8A83", fontWeight: isUnread ? 500 : 400, flexShrink: 0, marginLeft: 8 }}>{g.tijd}</span>
        </div>
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: "#8A8A83", margin: "1px 0 2px" }}>{g.context}</p>
        <p style={{ fontSize: 12, color: g.gelezen ? "#8A8A83" : "#1A1D1A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
          {g.gelezen && <CheckCheck size={11} style={{ color: "#2B4030", flexShrink: 0 }} />}
          {g.preview}
        </p>
      </div>

      {isUnread && (
        <span style={{ background: "#C97A4D", color: "#1A1D1A", fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 99, minWidth: 18, textAlign: "center", flexShrink: 0 }}>
          {g.unread}
        </span>
      )}
    </Link>
  );
}

export default function BerichtenPage() {
  const { activeView, userId, markBerichtenRead } = useUserStore();
  const [filter, setFilter] = useState<Filter>("alle");
  const [mounted, setMounted] = useState(false);
  const [gesprekken, setGesprekken] = useState<GesprekRij[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState("");
  const [nieuwOpen, setNieuwOpen] = useState(false);
  const [persoonZoek, setPersoonZoek] = useState("");
  const [personen, setPersonen] = useState<{ id: string; naam: string; sub: string | null }[]>([]);
  const [persoonBusy, setPersoonBusy] = useState(false);
  const router = useRouter();

  const isVakman = mounted ? activeView === "vakman" : true;

  // ── Nieuw gesprek: personen zoeken op naam ──────────────────
  useEffect(() => {
    if (!nieuwOpen || !supabaseReady) return;
    const t = setTimeout(async () => {
      const term = persoonZoek.trim();
      if (isVakman) {
        // Vakman start gesprek met een klant
        let q = supabase.from("profiles").select("id, name, city").neq("id", userId ?? "").limit(8);
        if (term) q = q.ilike("name", `%${term}%`);
        const { data } = await q;
        setPersonen(((data ?? []) as { id: string; name: string; city: string | null }[])
          .map(p => ({ id: p.id, naam: p.name, sub: p.city })));
      } else {
        // Klant start gesprek met een vakman
        const { data } = await supabase
          .from("vakmensen")
          .select("id, specialty, profiles(name)")
          .limit(20);
        const rows = ((data ?? []) as unknown as { id: string; specialty: string | null; profiles: { name: string } | null }[])
          .filter(v => v.id !== userId)
          .map(v => ({ id: v.id, naam: v.profiles?.name ?? "Vakman", sub: v.specialty }))
          .filter(v => !term || v.naam.toLowerCase().includes(term.toLowerCase()));
        setPersonen(rows.slice(0, 8));
      }
    }, 250);
    return () => clearTimeout(t);
  }, [nieuwOpen, persoonZoek, isVakman, userId]);

  // ── Gesprek vinden of aanmaken, dan openen ──────────────────
  const startGesprek = async (andereId: string, naam: string) => {
    if (!userId || persoonBusy) return;
    setPersoonBusy(true);
    const klantId  = isVakman ? andereId : userId;
    const vakmanId = isVakman ? userId : andereId;
    const { data: bestaandRaw } = await supabase
      .from("gesprekken").select("id")
      .eq("klant_id", klantId).eq("vakman_id", vakmanId)
      .order("laatste_tijd", { ascending: false }).limit(1).maybeSingle();
    const bestaand = bestaandRaw as { id: string } | null;
    if (bestaand?.id) { router.push(`/chat/${bestaand.id}`); return; }
    const { data: nieuwRaw, error } = await supabase
      .from("gesprekken")
      .insert({
        klant_id: klantId, vakman_id: vakmanId,
        context: `Gesprek met ${naam}`,
        laatste_bericht: null, ongelezen_klant: 0, ongelezen_vakman: 0,
        gearchiveerd: false, boeking_id: null, spoed_id: null,
      } as never)
      .select("id").single();
    setPersoonBusy(false);
    const nieuw = nieuwRaw as { id: string } | null;
    if (error || !nieuw?.id) { alert("Gesprek starten mislukt" + (error ? `: ${error.message}` : "")); return; }
    router.push(`/chat/${nieuw.id}`);
  };

  const laad = useCallback(async () => {
    if (!userId || !supabaseReady) { setLoading(false); return; }

    const rol = isVakman ? "vakman" : "klant";
    const field = rol === "klant" ? "klant_id" : "vakman_id";

    const { data } = await supabase
      .from("gesprekken")
      .select(`*, profiles!gesprekken_klant_id_fkey(name, avatar_url), vakmensen!gesprekken_vakman_id_fkey(specialty, profiles(name, avatar_url))`)
      .eq(field, userId)
      .order("laatste_tijd", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Zet ruwe Supabase data om naar weergave-rows
    const rijen: GesprekRij[] = data.map((g: Record<string, unknown>, idx: number) => {
      // Bepaal naam van de andere partij
      let naam = "Onbekend";
      if (isVakman) {
        const profiles = g.profiles as Record<string, unknown> | null;
        naam = (profiles?.name as string) ?? "Klant";
      } else {
        const vakmensen = g.vakmensen as Record<string, unknown> | null;
        const vProfiles = vakmensen?.profiles as Record<string, unknown> | null;
        naam = (vProfiles?.name as string) ?? "Vakman";
      }

      const context = (g.context as string) ?? (isVakman ? "Opdracht" : "Vakman");
      const unread = isVakman ? ((g.ongelezen_vakman as number) ?? 0) : ((g.ongelezen_klant as number) ?? 0);

      return {
        id: g.id as string,
        naam,
        initial: initiaal(naam),
        avatarBg: AVATAR_COLORS[idx % AVATAR_COLORS.length],
        context,
        preview: (g.laatste_bericht as string) ?? "Gesprek gestart",
        tijd: tijdLabel(g.laatste_tijd as string),
        unread,
        gelezen: unread === 0,
        gearchiveerd: Boolean(g.gearchiveerd),
      };
    });

    setGesprekken(rijen);
    setLoading(false);
  }, [userId, isVakman]);

  useEffect(() => {
    setMounted(true);
    markBerichtenRead();
  }, [markBerichtenRead]);

  useEffect(() => { if (mounted) laad(); }, [mounted, laad]);

  // Realtime: nieuwe berichten
  useEffect(() => {
    if (!supabaseReady || !userId) return;
    const channel = supabase.channel("berichten_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "gesprekken" }, () => laad())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, laad]);

  const actief = gesprekken.filter(g => !g.gearchiveerd);
  const onbeantwoord = actief.filter(g => g.unread > 0);
  const basis = filter === "onbeantwoord" ? onbeantwoord
    : filter === "archief" ? gesprekken.filter(g => g.gearchiveerd)
    : actief;
  const zichtbaar = zoek.trim()
    ? basis.filter(g =>
        g.naam.toLowerCase().includes(zoek.toLowerCase()) ||
        g.context.toLowerCase().includes(zoek.toLowerCase()))
    : basis;

  // Fallback mock data als Supabase nog geen gesprekken heeft
  const toonMock = !loading && gesprekken.length === 0 && supabaseReady;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>
              {onbeantwoord.length} {isVakman ? "onbeantwoord" : "wachtend"}
            </p>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>Berichten</h2>
          </div>
          <button onClick={() => { setNieuwOpen(true); setPersoonZoek(""); }} aria-label="Nieuw gesprek" className="touch-scale" style={{ padding: 8, background: "transparent", border: "0.5px solid #E5DDD0", borderRadius: 99, color: "#1A1D1A", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <PenSquare size={15} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          <Search size={16} style={{ color: "#8A8A83", flexShrink: 0 }} />
          <input
            type="text"
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            placeholder={isVakman ? "Zoek in gesprekken…" : "Zoek vakman of klus…"}
            style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#1A1D1A", flex: 1, background: "transparent", border: "none", outline: "none" }}
          />
          {zoek && (
            <button onClick={() => setZoek("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
              <X size={14} style={{ color: "#8A8A83" }} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, paddingBottom: 12, borderBottom: "0.5px solid #E5DDD0" }}>
          {(["alle", "onbeantwoord", "archief"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: 11, padding: "5px 11px",
              background: filter === f ? "#1A1D1A" : "transparent",
              color: filter === f ? "#F5EFE5" : "#5C5C56",
              border: filter === f ? "none" : "0.5px solid #E5DDD0",
              borderRadius: 99, cursor: "pointer", fontWeight: filter === f ? 500 : 400,
            }}>
              {f === "onbeantwoord"
                ? <>{f.charAt(0).toUpperCase() + f.slice(1)} <span style={{ color: filter === f ? "#EDE4D2" : "#C97A4D" }}>·{onbeantwoord.length}</span></>
                : f.charAt(0).toUpperCase() + f.slice(1)
              }
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-28">
        {loading && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#8A8A83", textAlign: "center", paddingTop: 32 }}>Laden…</p>}

        {toonMock && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: "#1A1D1A", margin: "0 0 8px" }}>Nog geen berichten</p>
            <p style={{ fontSize: 13, color: "#8A8A83" }}>
              {isVakman ? "Berichten van klanten verschijnen hier." : "Start een gesprek met een vakman via Zoeken."}
            </p>
          </div>
        )}

        {zichtbaar.map((g, i) => <GesprekItem key={g.id} g={g} i={i} />)}
      </div>

      {/* ── Nieuw gesprek modal ── */}
      {nieuwOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(26,29,26,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setNieuwOpen(false)}>
          <div className="animate-slide-up" onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 480, background: "#FBF7F0",
            borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", maxHeight: "70dvh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 400, margin: 0 }}>Nieuw gesprek</h3>
              <button onClick={() => setNieuwOpen(false)} className="touch-scale" style={{ background: "#EDE4D2", border: "none", borderRadius: 99, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={15} />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={persoonZoek}
              onChange={e => setPersoonZoek(e.target.value)}
              placeholder={isVakman ? "Zoek klant op naam…" : "Zoek vakman op naam…"}
              style={{ width: "100%", padding: "12px 14px", background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 10, fontSize: 14, marginBottom: 12 }}
            />
            {personen.length === 0 ? (
              <p style={{ fontSize: 13, color: "#8A8A83", textAlign: "center", padding: "16px 0" }}>
                {persoonZoek ? "Niemand gevonden." : "Typ een naam om te zoeken."}
              </p>
            ) : (
              personen.map((p, i) => (
                <button key={p.id} onClick={() => startGesprek(p.id, p.naam)} disabled={persoonBusy} style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "12px 4px", background: "transparent", border: "none",
                  borderTop: i > 0 ? "0.5px solid #E5DDD0" : "none",
                  cursor: "pointer", textAlign: "left", opacity: persoonBusy ? 0.6 : 1,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: SERIF, fontSize: 15,
                    color: AVATAR_COLORS[i % AVATAR_COLORS.length] === "#EDE4D2" ? "#1A1D1A" : "#F5EFE5", flexShrink: 0,
                  }}>{initiaal(p.naam)}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{p.naam}</p>
                    {p.sub && <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>{p.sub}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
