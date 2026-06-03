"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Clock, Camera, MapPin } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, type SpoedOproep } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

// ════════════════════════════════════════════════════════════════
// VAKMAN — Spoed oproepen (realtime)
// ════════════════════════════════════════════════════════════════
function VakmanSpoed() {
  const { userId } = useUserStore();
  const [beschikbaar, setBeschikbaar] = useState(false);
  const [oproepen, setOproepen] = useState<SpoedOproep[]>([]);
  const [afgewezen, setAfgewezen] = useState<string[]>([]);
  const [aangenomen, setAangenomen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const laad = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return; }
    const { data } = await supabase
      .from("spoed_oproepen")
      .select("*")
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setOproepen((data as SpoedOproep[]) ?? []);
    setLoading(false);
  }, []);

  // Laad beschikbaarheid uit vakmensen tabel
  useEffect(() => {
    laad();
    if (!userId || !supabaseReady) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("vakmensen") as any).select("beschikbaar").eq("id", userId).single()
      .then(({ data }: { data: { beschikbaar: boolean } | null }) => { if (data) setBeschikbaar(data.beschikbaar); });
  }, [userId, laad]);

  // Realtime: nieuwe oproepen binnenkomen
  useEffect(() => {
    if (!supabaseReady) return;
    const channel = supabase.channel("spoed_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "spoed_oproepen" }, () => laad())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [laad]);

  const toggleBeschikbaar = async () => {
    const nieuw = !beschikbaar;
    setBeschikbaar(nieuw);
    if (userId && supabaseReady) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("vakmensen") as any).update({ beschikbaar: nieuw }).eq("id", userId);
    }
  };

  const neem = async (o: SpoedOproep) => {
    setAangenomen(v => [...v, o.id]);
    if (supabaseReady) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("spoed_oproepen") as any).update({ status: "aangenomen", aangenomen_door: userId }).eq("id", o.id);
    }
  };

  const wijs = (id: string) => setAfgewezen(v => [...v, id]);

  const zichtbaar = oproepen.filter(o => !afgewezen.includes(o.id) && !aangenomen.includes(o.id));

  // Tijdlabel berekenen
  const tijdGeleden = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "zojuist";
    if (diff < 60) return `${diff} min geleden`;
    return `${Math.floor(diff / 60)}u geleden`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>Oproepen in de buurt</p>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>Spoed</h2>
      </div>

      <div className="px-5 pb-28">
        {/* Beschikbaarheid toggle */}
        <div style={{ background: "#1A1D1A", color: "#F5EFE5", borderRadius: 14, padding: "14px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: beschikbaar ? "#C97A4D" : "#3A3D3A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={18} style={{ color: "#1A1D1A" }} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>Beschikbaar voor spoed</p>
            <p style={{ fontSize: 11, color: "#B8B4A8", margin: "2px 0 0" }}>Binnen 8 km · vandaag tot 22:00</p>
          </div>
          <button onClick={toggleBeschikbaar} style={{
            width: 40, height: 22, background: beschikbaar ? "#C97A4D" : "#3A3D3A",
            borderRadius: 99, position: "relative", border: "none", cursor: "pointer", flexShrink: 0,
          }}>
            <span style={{ position: "absolute", top: 3, left: beschikbaar ? "calc(100% - 19px)" : 3, width: 16, height: 16, background: "#1A1D1A", borderRadius: "50%", transition: "left 0.15s" }} />
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: 0 }}>Binnenkomend</p>
          <span style={{ fontSize: 11, color: "#8A8A83" }}>{zichtbaar.length} oproepen</span>
        </div>

        {loading && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#8A8A83", textAlign: "center", paddingTop: 24 }}>Laden…</p>}

        {!loading && zichtbaar.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: "#1A1D1A", margin: "0 0 8px" }}>Geen oproepen</p>
            <p style={{ fontSize: 13, color: "#8A8A83" }}>Er zijn momenteel geen open spoed-oproepen in de buurt.</p>
          </div>
        )}

        {zichtbaar.map(o => (
          <div key={o.id} style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderLeft: "3px solid #C97A4D", borderRadius: 12, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#C97A4D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 16, color: "#1A1D1A", flexShrink: 0 }}>
                  {o.categorie?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{o.adres ?? "Onbekend adres"}</p>
                  <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>{o.categorie}</p>
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#C97A4D", fontWeight: 500 }}>{tijdGeleden(o.created_at)}</span>
            </div>

            {o.titel && <p style={{ fontFamily: SERIF, fontSize: 17, margin: "0 0 4px", color: "#1A1D1A" }}>{o.titel}</p>}
            {o.omschrijving && <p style={{ fontSize: 12, color: "#5C5C56", margin: "0 0 12px", lineHeight: 1.4 }}>{o.omschrijving}</p>}

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {o.prijs_min && o.prijs_max && (
                <span style={{ fontFamily: SERIF, fontSize: 12, padding: "3px 10px", background: "#EDE4D2", borderRadius: 6, color: "#1A1D1A" }}>
                  €{Math.round(o.prijs_min / 100)} – €{Math.round(o.prijs_max / 100)}
                </span>
              )}
              {o.foto_urls?.length > 0 && (
                <span style={{ fontSize: 11, padding: "3px 10px", background: "#EDE4D2", borderRadius: 6, color: "#5C5C56", display: "flex", alignItems: "center", gap: 4 }}>
                  <Camera size={11} /> {o.foto_urls.length} foto&apos;s
                </span>
              )}
              <span style={{ fontSize: 11, padding: "3px 10px", background: "#EDE4D2", borderRadius: 6, color: "#5C5C56", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> ~45 min
              </span>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => neem(o)} style={{ flex: 2, padding: 10, fontSize: 13, fontWeight: 500, background: "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 10, cursor: "pointer" }}>Aannemen</button>
              <button onClick={() => wijs(o.id)} style={{ flex: 1, padding: 10, fontSize: 13, background: "transparent", color: "#5C5C56", border: "0.5px solid #E5DDD0", borderRadius: 10, cursor: "pointer" }}>Doorlaten</button>
            </div>
          </div>
        ))}

        {aangenomen.length > 0 && (
          <div style={{ background: "#FBF7F0", border: "0.5px solid #2B4030", borderRadius: 12, padding: "14px 16px", marginBottom: 10, opacity: 0.85 }}>
            <p style={{ fontFamily: SERIF, fontSize: 15, margin: 0, color: "#2B4030" }}>✓ {aangenomen.length} oproep aangenomen</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// KLANT — Spoed formulier → schrijft naar Supabase
// ════════════════════════════════════════════════════════════════
const KLANT_CATS = [
  { id: "lekkage",         label: "Lekkage",          emoji: "💧" },
  { id: "geen-stroom",     label: "Geen stroom",       emoji: "⚡" },
  { id: "verstopping",     label: "Verstopping",       emoji: "🚽" },
  { id: "geen-warm-water", label: "Geen warm water",   emoji: "🚿" },
  { id: "slot-stuk",       label: "Slot stuk",         emoji: "🔑" },
  { id: "iets-anders",     label: "Iets anders",       emoji: "🛠️" },
];

function KlantSpoed() {
  const { address, userId } = useUserStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [omschrijving, setOmschrijving] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const verstuur = async () => {
    if (!selected) return;
    setSending(true); setError("");

    if (supabaseReady && userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase.from("spoed_oproepen") as any).insert({
        klant_id: userId,
        categorie: selected,
        omschrijving: omschrijving || null,
        adres: address || null,
        foto_urls: [],
        status: "open",
      });
      if (err) { setError("Er ging iets mis. Probeer opnieuw."); setSending(false); return; }
    }

    setSending(false);
    setSent(true);
  };

  if (sent) return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>Spoed</h2>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Zap size={28} style={{ color: "#F5EFE5" }} />
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 24, color: "#1A1D1A", margin: "0 0 8px" }}>Verstuurd!</p>
        <p style={{ fontSize: 13, color: "#5C5C56", maxWidth: 280 }}>
          Je oproep is verstuurd naar vakmensen in de buurt. Je krijgt binnen 5 minuten een reactie.
        </p>
        <button onClick={() => { setSent(false); setSelected(null); setOmschrijving(""); }}
          style={{ marginTop: 28, padding: "12px 28px", borderRadius: 10, background: "#2B4030", color: "#F5EFE5", fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer" }}>
          Nieuwe oproep
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1A1D1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} style={{ color: "#C97A4D" }} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>Spoed</h2>
        </div>
      </div>

      <div className="px-5 pb-28">
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, margin: "0 0 24px", color: "#1A1D1A", lineHeight: 1.1 }}>
          Wat is er<br /><span style={{ fontStyle: "italic", color: "#8A8A83" }}>aan de hand?</span>
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
          {KLANT_CATS.map(cat => {
            const isSelected = selected === cat.id;
            return (
              <button key={cat.id} onClick={() => setSelected(cat.id)} style={{
                padding: "14px 12px", borderRadius: 12, cursor: "pointer",
                background: isSelected ? "#1A1D1A" : "#FBF7F0",
                border: isSelected ? "none" : "0.5px solid #E5DDD0",
                display: "flex", alignItems: "center", gap: 10, textAlign: "left",
              }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: isSelected ? "#C97A4D" : "#EDE4D2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{cat.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: isSelected ? "#F5EFE5" : "#1A1D1A" }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#8A8A83", display: "block", marginBottom: 6, fontWeight: 500 }}>Omschrijving</label>
          <textarea value={omschrijving} onChange={e => setOmschrijving(e.target.value)} placeholder="Beschrijf wat er aan de hand is…" rows={3}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "0.5px solid #E5DDD0", background: "#FBF7F0", fontSize: 14, color: "#1A1D1A", resize: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 16, padding: 16, border: "1px dashed #E5DDD0", borderRadius: 10, background: "#FBF7F0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
          <Camera size={18} style={{ color: "#8A8A83" }} />
          <span style={{ fontSize: 13, color: "#8A8A83" }}>Foto&apos;s toevoegen</span>
        </div>

        <div style={{ marginBottom: 22, padding: "12px 14px", background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <MapPin size={15} style={{ color: "#2B4030", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#1A1D1A", flex: 1 }}>{address || "Amsterdam"}</span>
        </div>

        {error && <p style={{ fontSize: 12, color: "#C97A4D", marginBottom: 10, textAlign: "center" }}>{error}</p>}

        <button onClick={verstuur} disabled={!selected || sending} style={{
          width: "100%", padding: 14, fontSize: 14, fontWeight: 500,
          background: selected ? "#2B4030" : "#E5DDD0",
          color: selected ? "#F5EFE5" : "#8A8A83",
          border: "none", borderRadius: 10, cursor: selected ? "pointer" : "default",
        }}>
          {sending ? "Versturen…" : "Stuur naar vakmensen in de buurt"}
        </button>
        <p style={{ fontSize: 11, color: "#8A8A83", textAlign: "center", marginTop: 8 }}>≈ 5 min responstijd</p>
      </div>
    </div>
  );
}

export default function SpoedPage() {
  const { activeView } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return activeView === "vakman" ? <VakmanSpoed /> : <KlantSpoed />;
}
