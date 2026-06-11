"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Camera, MoreVertical, Check, CheckCheck, Archive } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, type Bericht } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

type GesprekInfo = {
  id: string;
  context: string | null;
  klant_id: string;
  vakman_id: string;
  andereNaam: string;
  andereInitiaal: string;
};

function tijdLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function initiaal(naam: string) {
  return naam?.charAt(0)?.toUpperCase() ?? "?";
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { userId: storeUserId, activeView, setUserId } = useUserStore();
  const isVakman = activeView === "vakman";

  const [userId, setLocalUserId] = useState<string | null>(storeUserId);
  const [gesprek, setGesprek] = useState<GesprekInfo | null>(null);
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fallback: haal userId op uit Supabase sessie als de store leeg is
  useEffect(() => {
    if (storeUserId) { setLocalUserId(storeUserId); return; }
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setLocalUserId(session.user.id);
      }
    });
  }, [storeUserId, setUserId]);

  // ── Laad gesprek info ────────────────────────────────────────────────────────
  const laadGesprek = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: g } = await (supabase.from("gesprekken") as any)
      .select(`*, klant:profiles!gesprekken_klant_id_fkey(name), vakman:vakmensen!gesprekken_vakman_id_fkey(profiles(name))`)
      .eq("id", id)
      .single();

    if (g) {
      const gAny = g as Record<string, unknown>;
      const andereNaam = isVakman
        ? ((gAny.klant as Record<string, unknown>)?.name as string) ?? "Klant"
        : ((gAny.vakman as Record<string, unknown>)?.profiles as Record<string, unknown>)?.name as string ?? "Vakman";

      setGesprek({
        id: gAny.id as string,
        context: gAny.context as string | null,
        klant_id: gAny.klant_id as string,
        vakman_id: gAny.vakman_id as string,
        andereNaam,
        andereInitiaal: initiaal(andereNaam),
      });
    }
    setLoading(false);
  }, [id, isVakman]);

  // ── Laad berichten ───────────────────────────────────────────────────────────
  const laadBerichten = useCallback(async () => {
    if (!supabaseReady) return;
    const { data } = await supabase
      .from("berichten")
      .select("*")
      .eq("gesprek_id", id)
      .order("created_at", { ascending: true });
    setBerichten((data as Bericht[]) ?? []);
  }, [id]);

  useEffect(() => {
    laadGesprek();
    laadBerichten();
  }, [laadGesprek, laadBerichten]);

  // ── Markeer als gelezen (teller op 0 + berichten van de ander gelezen) ──────
  useEffect(() => {
    if (!supabaseReady || !userId || !gesprek) return;
    const field = isVakman ? "ongelezen_vakman" : "ongelezen_klant";
    supabase.from("gesprekken").update({ [field]: 0 } as never).eq("id", id).then();
    supabase.from("berichten").update({ gelezen: true } as never)
      .eq("gesprek_id", id).neq("afzender_id", userId).eq("gelezen", false).then();
  }, [gesprek, userId, isVakman, id]);

  // ── Realtime nieuwe berichten ────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseReady) return;
    const channel = supabase.channel(`chat_${id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "berichten",
        filter: `gesprek_id=eq.${id}`,
      }, (payload) => {
        setBerichten(prev => {
          // Verwijder temp bericht als het echt binnenkomt
          const filtered = prev.filter(b => !b.id.startsWith("temp_"));
          return [...filtered, payload.new as Bericht];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // ── Scroll naar onderen ──────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [berichten]);

  // ── Verstuur bericht ─────────────────────────────────────────────────────────
  const send = async () => {
    if (!input.trim() || !userId) return;
    const tekst = input.trim();
    setInput("");
    setSending(true);

    // Optimistisch toevoegen
    const tempMsg: Bericht = {
      id: `temp_${Date.now()}`,
      gesprek_id: id,
      afzender_id: userId,
      tekst,
      bijlage_url: null,
      bijlage_type: null,
      gelezen: false,
      created_at: new Date().toISOString(),
    };
    setBerichten(prev => [...prev, tempMsg]);

    if (supabaseReady) {
      await supabase.from("berichten").insert({
        gesprek_id: id,
        afzender_id: userId,
        tekst,
      } as never);
      await updateGesprekNaBericht(tekst);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  // Preview + echte increment van de ongelezen-teller voor de andere partij
  const updateGesprekNaBericht = async (preview: string) => {
    const andereOngelezen = isVakman ? "ongelezen_klant" : "ongelezen_vakman";
    const { data: huidige } = await supabase
      .from("gesprekken").select(andereOngelezen).eq("id", id).single();
    const teller = ((huidige as Record<string, number> | null)?.[andereOngelezen] ?? 0) + 1;
    await supabase.from("gesprekken").update({
      laatste_bericht: preview,
      laatste_tijd: new Date().toISOString(),
      [andereOngelezen]: teller,
    } as never).eq("id", id);
  };

  // ── Foto versturen: upload naar Supabase Storage, URL in bericht ─────────────
  const sendFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    e.target.value = "";

    // Optimistische preview terwijl de upload loopt
    const tempId = `temp_foto_${Date.now()}`;
    const localUrl = URL.createObjectURL(file);
    setBerichten(prev => [...prev, {
      id: tempId,
      gesprek_id: id, afzender_id: userId,
      tekst: null, bijlage_url: localUrl,
      bijlage_type: "foto", gelezen: false,
      created_at: new Date().toISOString(),
    }]);

    if (!supabaseReady) return;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const pad = `${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-fotos").upload(pad, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("chat-fotos").getPublicUrl(pad);

      await supabase.from("berichten").insert({
        gesprek_id: id,
        afzender_id: userId,
        tekst: null,
        bijlage_url: pub.publicUrl,
        bijlage_type: "foto",
      } as never);
      await updateGesprekNaBericht("📷 Foto");
      // Realtime INSERT vervangt de temp-preview
    } catch (err) {
      setBerichten(prev => prev.filter(b => b.id !== tempId));
      alert("Foto versturen mislukt: " + (err instanceof Error ? err.message : "onbekende fout"));
    }
  };

  // ── Gesprek archiveren (kebab-menu) ──────────────────────────────────────────
  const archiveer = async () => {
    if (supabaseReady) {
      await supabase.from("gesprekken").update({ gearchiveerd: true } as never).eq("id", id);
    }
    router.push("/berichten");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#F5EFE5", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: "#8A8A83" }}>Laden…</p>
    </div>
  );

  if (!gesprek && !loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#F5EFE5", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <p style={{ fontFamily: SERIF, fontSize: 18, color: "#1A1D1A", marginBottom: 8 }}>Gesprek niet gevonden</p>
      <Link href="/berichten" style={{ fontSize: 13, color: "#2B4030", textDecoration: "underline" }}>← Terug naar berichten</Link>
    </div>
  );

  const andereNaam = gesprek?.andereNaam ?? "Onbekend";
  const andereInitiaal = gesprek?.andereInitiaal ?? "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#F5EFE5" }}>

      {/* ── Header ── */}
      <div style={{ background: "#F5EFE5", borderBottom: "0.5px solid #E5DDD0", paddingTop: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 12px" }}>
          <Link href="/berichten" style={{
            width: 36, height: 36, borderRadius: "50%", background: "#EDE4D2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none",
          }}>
            <ArrowLeft size={17} color="#1A1D1A" />
          </Link>

          {/* Avatar + naam */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", background: "#2B4030",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: SERIF, fontSize: 16, color: "#F5EFE5", flexShrink: 0,
            }}>{andereInitiaal}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "#1A1D1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {andereNaam}
              </p>
              {gesprek?.context && (
                <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: "#8A8A83", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {gesprek.context}
                </p>
              )}
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(o => !o)} aria-label="Gespreksopties" style={{ width: 36, height: 36, borderRadius: "50%", background: "#EDE4D2", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <MoreVertical size={17} color="#1A1D1A" />
            </button>
            {menuOpen && (
              <div className="animate-fade-in" style={{
                position: "absolute", right: 0, top: 42, zIndex: 30,
                background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 12,
                boxShadow: "0 4px 16px rgba(26,29,26,0.12)", overflow: "hidden", minWidth: 180,
              }}>
                <button onClick={archiveer} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "12px 16px", background: "transparent", border: "none",
                  fontSize: 13, color: "#1A1D1A", cursor: "pointer",
                }}>
                  <Archive size={15} color="#5C5C56" /> Gesprek archiveren
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Klik buiten menu sluit het */}
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />}

      {/* ── Berichten lijst ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 6 }}>

        {berichten.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, paddingTop: 48 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EDE4D2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              💬
            </div>
            <p style={{ fontFamily: SERIF, fontSize: 16, color: "#1A1D1A", margin: 0 }}>Begin het gesprek</p>
            <p style={{ fontSize: 13, color: "#8A8A83", textAlign: "center", maxWidth: 220 }}>
              Stuur een bericht om het gesprek met {andereNaam} te starten.
            </p>
          </div>
        )}

        {berichten.map((b, i) => {
          const vanMij = b.afzender_id === userId;
          const isTemp = b.id.startsWith("temp_");
          const prevSameUser = i > 0 && berichten[i - 1].afzender_id === b.afzender_id;
          const showTime = !prevSameUser || (i === berichten.length - 1);

          return (
            <div key={b.id} style={{ display: "flex", flexDirection: "column", alignItems: vanMij ? "flex-end" : "flex-start" }}>
              {/* Naam tonen bij eerste bericht van andere partij */}
              {!vanMij && !prevSameUser && (
                <p style={{ fontSize: 11, color: "#8A8A83", marginBottom: 3, marginLeft: 4 }}>{andereNaam}</p>
              )}

              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, maxWidth: "80%" }}>
                {/* Avatar andere partij */}
                {!vanMij && !prevSameUser && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 12, color: "#F5EFE5", flexShrink: 0, marginBottom: 2 }}>
                    {andereInitiaal}
                  </div>
                )}
                {!vanMij && prevSameUser && <div style={{ width: 28, flexShrink: 0 }} />}

                <div>
                  {/* Foto bijlage */}
                  {b.bijlage_url && b.bijlage_type === "foto" && (
                    <div style={{ borderRadius: vanMij ? "14px 14px 4px 14px" : "14px 14px 14px 4px", overflow: "hidden", marginBottom: 2 }}>
                      <img src={b.bijlage_url} alt="foto" style={{ width: 200, height: 150, objectFit: "cover", display: "block" }} />
                    </div>
                  )}

                  {/* Tekst bericht */}
                  {b.tekst && (
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: vanMij ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: vanMij ? "#2B4030" : "#FBF7F0",
                      border: vanMij ? "none" : "0.5px solid #E5DDD0",
                      opacity: isTemp ? 0.7 : 1,
                    }}>
                      <p style={{ fontSize: 14, color: vanMij ? "#F5EFE5" : "#1A1D1A", margin: 0, lineHeight: 1.5 }}>{b.tekst}</p>
                    </div>
                  )}

                  {/* Tijdstip + gelezen */}
                  {showTime && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3, justifyContent: vanMij ? "flex-end" : "flex-start" }}>
                      <span style={{ fontSize: 10, color: "#8A8A83" }}>{tijdLabel(b.created_at)}</span>
                      {vanMij && (
                        isTemp
                          ? <Check size={11} color="#8A8A83" />
                          : <CheckCheck size={11} color={b.gelezen ? "#2B4030" : "#8A8A83"} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── Input balk ── */}
      <div style={{ background: "#F5EFE5", borderTop: "0.5px solid #E5DDD0", padding: "10px 12px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>

          {/* Foto knop */}
          <button onClick={() => fileInputRef.current?.click()} style={{
            width: 40, height: 40, borderRadius: "50%", background: "#EDE4D2",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer", flexShrink: 0,
          }}>
            <Camera size={18} color="#5C5C56" />
          </button>

          {/* Tekstveld */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 20, padding: "10px 14px", minHeight: 40 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Typ een bericht…"
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: 14, color: "#1A1D1A", resize: "none", lineHeight: 1.5,
                fontFamily: "Inter, sans-serif", maxHeight: 100,
              }}
            />
          </div>

          {/* Verstuur knop */}
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: input.trim() ? "#2B4030" : "#E5DDD0",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: input.trim() ? "pointer" : "default", flexShrink: 0,
              transition: "background 0.15s",
            }}>
            <Send size={17} color={input.trim() ? "#F5EFE5" : "#8A8A83"} />
          </button>
        </div>
      </div>

      {/* Verborgen file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={sendFoto} />
    </div>
  );
}
