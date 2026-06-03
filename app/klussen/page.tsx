"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, MessageCircle } from "lucide-react";
import { supabase, supabaseReady } from "@/lib/supabase";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

type Status = "alle" | "gepland" | "bezig" | "afgerond";

type Boeking = {
  id: string;
  vakman_id: string;
  status: string;
  start_tijd: string;
  bedrag: number | null;
  notities: string | null;
  vakmanNaam: string;
};

const STATUS_CFG: Record<string, { label: string; bg: string; kleur: string }> = {
  gepland:  { label: "Gepland",  bg: "#EAF0EC", kleur: "#2B4030" },
  bezig:    { label: "Bezig",    bg: "#FAF0E6", kleur: "#C97A4D" },
  afgerond: { label: "Afgerond", bg: "#F0EFE8", kleur: "#8A8A83" },
  betaald:  { label: "Betaald",  bg: "#EAF0EC", kleur: "#2B4030" },
};

function datumLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

export default function KlussenPage() {
  const router = useRouter();
  const { userId: storeUserId } = useUserStore();
  const [userId, setUserId] = useState<string | null>(storeUserId);
  const [filter, setFilter] = useState<Status>("alle");
  const [boekingen, setBoekingen] = useState<Boeking[]>([]);
  const [loading, setLoading] = useState(true);
  const [geselecteerd, setGeselecteerd] = useState<Boeking | null>(null);

  // UserId fallback
  useEffect(() => {
    if (storeUserId) { setUserId(storeUserId); return; }
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, [storeUserId]);

  const laad = useCallback(async (uid: string) => {
    setLoading(true);
    const { data } = await (supabase.from("boekingen") as any)
      .select("*, vakman:profiles!boekingen_vakman_id_fkey(name)")
      .eq("klant_id", uid)
      .order("start_tijd", { ascending: false });

    const rows = (data ?? []).map((b: any) => ({
      id: b.id,
      vakman_id: b.vakman_id,
      status: b.status,
      start_tijd: b.start_tijd,
      bedrag: b.bedrag,
      notities: b.notities,
      vakmanNaam: b.vakman?.name ?? "Vakman",
    }));
    setBoekingen(rows);
    setLoading(false);
  }, []);

  useEffect(() => { if (userId) laad(userId); }, [userId, laad]);

  const zichtbaar = filter === "alle" ? boekingen : boekingen.filter(b => b.status === filter);
  const totaalUitgegeven = boekingen.filter(b => b.status === "afgerond" || b.status === "betaald").reduce((t, b) => t + (b.bedrag ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={() => router.push("/profile")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>Jouw geschiedenis</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>Mijn boekingen</h2>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["alle", "gepland", "bezig", "afgerond"] as Status[]).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              fontSize: 11, padding: "5px 11px",
              background: filter === s ? "#1A1D1A" : "transparent",
              color: filter === s ? "#F5EFE5" : "#5C5C56",
              border: filter === s ? "none" : "0.5px solid #E5DDD0",
              borderRadius: 99, cursor: "pointer",
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-28">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "#E5DDD0", gap: "0.5px", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          {[
            { label: "Boekingen",  value: String(boekingen.length) },
            { label: "Afgerond",   value: String(boekingen.filter(b => b.status === "afgerond").length) },
            { label: "Uitgegeven", value: `€${Math.round(totaalUitgegeven / 100)}` },
          ].map(s => (
            <div key={s.label} style={{ background: "#FBF7F0", padding: "14px 10px" }}>
              <p style={{ fontFamily: SERIF, fontSize: 20, margin: 0, color: "#1A1D1A" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#8A8A83", textAlign: "center", paddingTop: 32 }}>Laden…</p>
        ) : zichtbaar.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: "#1A1D1A", margin: "0 0 8px" }}>Geen boekingen</p>
            <p style={{ fontSize: 13, color: "#8A8A83" }}>Nog geen klussen in deze categorie.</p>
          </div>
        ) : (
          zichtbaar.map((b, i) => {
            const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.gepland;
            return (
              <button key={b.id} onClick={() => setGeselecteerd(b)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 0", background: "none", border: "none", cursor: "pointer",
                borderTop: i > 0 ? "0.5px solid #E5DDD0" : "none", textAlign: "left",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 18, color: "#F5EFE5", flexShrink: 0 }}>
                  {b.vakmanNaam.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{b.notities ?? "Klus"}</p>
                  <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>{b.vakmanNaam} · {datumLabel(b.start_tijd)}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  {b.bedrag && <p style={{ fontFamily: SERIF, fontSize: 15, color: "#1A1D1A", margin: 0 }}>€{Math.round(b.bedrag / 100)}</p>}
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: cfg.bg, color: cfg.kleur, fontWeight: 500 }}>{cfg.label}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {geselecteerd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={() => setGeselecteerd(null)}>
          <div style={{ background: "#FBF7F0", borderRadius: "20px 20px 0 0", padding: 24, paddingBottom: 40 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: "#E5DDD0", borderRadius: 99, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 20, color: "#F5EFE5" }}>
                {geselecteerd.vakmanNaam.charAt(0)}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{geselecteerd.vakmanNaam}</p>
                <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>{(STATUS_CFG[geselecteerd.status] ?? STATUS_CFG.gepland).label}</p>
              </div>
            </div>
            <div style={{ borderTop: "0.5px solid #E5DDD0", borderBottom: "0.5px solid #E5DDD0", padding: "14px 0", marginBottom: 20 }}>
              {[
                { label: "Dienst",  value: geselecteerd.notities ?? "Klus" },
                { label: "Datum",   value: datumLabel(geselecteerd.start_tijd) },
                { label: "Prijs",   value: geselecteerd.bedrag ? `€${Math.round(geselecteerd.bedrag / 100)}` : "—" },
                { label: "Status",  value: (STATUS_CFG[geselecteerd.status] ?? STATUS_CFG.gepland).label },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontSize: 13, color: "#8A8A83" }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1A1D1A" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <button style={{ width: "100%", padding: 12, fontSize: 13, fontWeight: 500, background: "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <MessageCircle size={15} /> Bericht sturen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
