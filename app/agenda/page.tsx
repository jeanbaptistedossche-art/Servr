"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Clock, AlertTriangle, User, MapPin, Zap, Trash2, Coffee } from "lucide-react";
import { MOCK_AGENDA, MOCK_DIENSTEN, addMinutes, type AgendaSlot } from "@/lib/bedrijfStore";
import { useAgendaStore, DAG_LABELS, DAG_LABELS_LANG, type PauzeSlot } from "@/lib/agendaStore";

const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function getWeekDates(base: Date): Date[] {
  const d = new Date(base);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return nd;
  });
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tijdNaarMinuten(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function SlotKaart({ slot, diensten }: { slot: AgendaSlot; diensten: typeof MOCK_DIENSTEN }) {
  const dienst = diensten.find(d => d.id === slot.dienstId);
  const duurMin = tijdNaarMinuten(slot.eind) - tijdNaarMinuten(slot.start);

  const colorMap: Record<string, string> = {
    gereserveerd: "var(--teal)",
    beschikbaar: "#22c55e",
    bezet: "#64748b",
    buffer: "#f59e0b",
  };
  const bgMap: Record<string, string> = {
    gereserveerd: "var(--teal)" + "10",
    beschikbaar: "#22c55e10",
    bezet: "#64748b10",
    buffer: "#fef3c7",
  };

  return (
    <div className="rounded-2xl p-4 border-l-4 transition-all"
      style={{
        borderLeftColor: colorMap[slot.status],
        background: bgMap[slot.status],
        borderTop: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
      <div className="flex items-start gap-3">
        <div className="text-right flex-shrink-0" style={{ minWidth: 48 }}>
          <p className="font-black text-xs" style={{ color: colorMap[slot.status] }}>{slot.start}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{slot.eind}</p>
        </div>

        <div className="flex-1 min-w-0">
          {slot.overschreden && (
            <div className="flex items-center gap-1.5 mb-1.5 px-2 py-1 rounded-lg"
              style={{ background: "#fee2e2" }}>
              <AlertTriangle size={11} style={{ color: "#dc2626" }} />
              <span className="text-[10px] font-bold" style={{ color: "#dc2626" }}>Vorige taak liep uit — check overlapping</span>
            </div>
          )}

          {slot.status === "beschikbaar" ? (
            <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>Beschikbaar</p>
          ) : (
            <>
              <p className="font-bold text-sm truncate">{slot.opdrachtNaam || dienst?.naam || "Bezet"}</p>
              {slot.klant && (
                <div className="flex items-center gap-1.5 mt-1">
                  {slot.klantAvatar
                    ? <img src={slot.klantAvatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                    : <User size={12} style={{ color: "var(--muted)" }} />}
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{slot.klant}</p>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--muted)" }}>
              <Clock size={10} />{duurMin}m
            </div>
            {slot.reistijdNa && slot.reistijdNa > 0 && (
              <div className="flex items-center gap-1 text-[10px]" style={{ color: "#d97706" }}>
                <MapPin size={10} />+{slot.reistijdNa}m buffer
              </div>
            )}
          </div>
        </div>

        {slot.status === "gereserveerd" && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
            style={{ background: "var(--teal)" + "20", color: "var(--teal)" }}>
            Geboekt
          </span>
        )}
      </div>
    </div>
  );
}

function BeschikbaarheidForm({ datum, onSave, onCancel }: {
  datum: string;
  onSave: (slots: AgendaSlot[]) => void;
  onCancel: () => void;
}) {
  const [start, setStart] = useState("08:00");
  const [eind, setEind] = useState("17:00");

  const urenOpties = Array.from({ length: 24 }, (_, h) =>
    ["00", "30"].map(m => `${String(h).padStart(2, "0")}:${m}`)
  ).flat().filter(t => t >= "06:00" && t <= "20:00");

  return (
    <div className="card p-5 flex flex-col gap-4 animate-slide-up">
      <p className="font-black text-sm">Beschikbaarheid instellen</p>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {new Date(datum).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Begintijd</label>
          <select value={start} onChange={e => setStart(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}>
            {urenOpties.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Eindtijd</label>
          <select value={eind} onChange={e => setEind(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}>
            {urenOpties.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel}
          className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm border"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Annuleren
        </button>
        <button
          onClick={() => {
            const slot: AgendaSlot = {
              id: `ag-${Date.now()}`,
              datum,
              start,
              eind,
              status: "beschikbaar",
            };
            onSave([slot]);
          }}
          className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: "var(--teal)" }}>
          Opslaan
        </button>
      </div>
    </div>
  );
}

const TIJDEN = Array.from({ length: 24 }, (_, h) =>
  ["00", "30"].map(m => `${String(h).padStart(2, "0")}:${m}`)
).flat().filter(t => t >= "05:00" && t <= "22:00");

function WerkschemaTab() {
  const { schema, setDag, addPauze, removePauze } = useAgendaStore();
  const [saved, setSaved] = useState(false);
  const [addingPauzeFor, setAddingPauzeFor] = useState<number | null>(null);
  const [newPauze, setNewPauze] = useState<PauzeSlot>({ start: "12:30", eind: "13:30" });

  // Weekdagen in volgorde Ma-Zo (index 1-6, dan 0)
  const dagVolgorde = [1, 2, 3, 4, 5, 6, 0];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-2xl" style={{ background: "var(--teal)" + "10" }}>
        <p className="text-xs leading-relaxed" style={{ color: "var(--teal)" }}>
          📅 <strong>Werkschema.</strong> Stel in op welke dagen je werkt, hoe laat je start en stopt, en wanneer je pauze hebt. Klanten kunnen dan alleen boeken in jouw beschikbare uren.
        </p>
      </div>

      {dagVolgorde.map(dagIdx => {
        const dag = schema[dagIdx];
        const isWeekend = dagIdx === 0 || dagIdx === 6;
        return (
          <div key={dagIdx} className="card overflow-hidden">
            {/* Dag header */}
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => setDag(dagIdx, { actief: !dag.actief })}
                className="touch-scale relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                style={{ background: dag.actief ? "var(--teal)" : "var(--surface-2)" }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: dag.actief ? "calc(100% - 22px)" : "2px" }} />
              </button>
              <div className="flex-1">
                <p className="font-bold text-sm">{DAG_LABELS_LANG[dagIdx]}</p>
                {!dag.actief && <p className="text-xs" style={{ color: "var(--muted)" }}>Niet werkzaam</p>}
              </div>
              {dag.actief && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
                  {dag.start} – {dag.eind}
                </span>
              )}
            </div>

            {/* Dag details */}
            {dag.actief && (
              <div className="border-t px-4 pb-4 pt-3 flex flex-col gap-3"
                style={{ borderColor: "var(--border)" }}>

                {/* Werktijden */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>Begintijd</label>
                    <select value={dag.start}
                      onChange={e => setDag(dagIdx, { start: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}>
                      {TIJDEN.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>Eindtijd</label>
                    <select value={dag.eind}
                      onChange={e => setDag(dagIdx, { eind: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}>
                      {TIJDEN.filter(t => t > dag.start).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Pauzes */}
                {dag.pauzes.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {dag.pauzes.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: "#fef3c7" }}>
                        <Coffee size={12} style={{ color: "#d97706" }} />
                        <span className="text-xs font-semibold flex-1" style={{ color: "#92400e" }}>
                          Pauze {p.start} – {p.eind}
                        </span>
                        <button onClick={() => removePauze(dagIdx, i)}
                          className="touch-scale w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "#fde68a" }}>
                          <Trash2 size={10} style={{ color: "#d97706" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pauze toevoegen */}
                {addingPauzeFor === dagIdx ? (
                  <div className="flex flex-col gap-2 p-3 rounded-xl animate-slide-up"
                    style={{ background: "var(--surface-2)" }}>
                    <p className="text-xs font-bold" style={{ color: "var(--muted)" }}>Pauze toevoegen</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] mb-0.5 block" style={{ color: "var(--muted)" }}>Van</label>
                        <select value={newPauze.start}
                          onChange={e => setNewPauze(p => ({ ...p, start: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border outline-none text-xs"
                          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                          {TIJDEN.filter(t => t >= dag.start && t < dag.eind).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] mb-0.5 block" style={{ color: "var(--muted)" }}>Tot</label>
                        <select value={newPauze.eind}
                          onChange={e => setNewPauze(p => ({ ...p, eind: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border outline-none text-xs"
                          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                          {TIJDEN.filter(t => t > newPauze.start && t <= dag.eind).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAddingPauzeFor(null)}
                        className="touch-scale flex-1 py-2 rounded-xl border text-xs font-bold"
                        style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                        Annuleren
                      </button>
                      <button onClick={() => {
                        addPauze(dagIdx, newPauze);
                        setAddingPauzeFor(null);
                        setNewPauze({ start: "12:30", eind: "13:30" });
                      }}
                        className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: "#f59e0b" }}>
                        Toevoegen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingPauzeFor(dagIdx)}
                    className="touch-scale flex items-center gap-1.5 text-xs font-semibold py-1.5"
                    style={{ color: "#d97706" }}>
                    <Coffee size={13} /> + Pauze toevoegen
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button onClick={handleSave}
        className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm"
        style={{ background: saved ? "#22c55e" : "var(--teal)", transition: "background 0.3s" }}>
        {saved ? "✓ Schema opgeslagen!" : "Werkschema opslaan"}
      </button>
    </div>
  );
}

export default function AgendaPage() {
  const [weekBase, setWeekBase] = useState(new Date("2026-05-19"));
  const [selectedDay, setSelectedDay] = useState(toYMD(new Date("2026-05-19")));
  const [slots, setSlots] = useState<AgendaSlot[]>(MOCK_AGENDA);
  const [showBeschikbaar, setShowBeschikbaar] = useState(false);
  const [activeTab, setActiveTab] = useState<"agenda" | "schema">("agenda");

  const weekDagen = getWeekDates(weekBase);
  const daagSlots = slots
    .filter(s => s.datum === selectedDay)
    .sort((a, b) => a.start.localeCompare(b.start));

  const gereserveerd = slots.filter(s => s.status === "gereserveerd").length;
  const overschreden = slots.filter(s => s.overschreden).length;

  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  };
  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  };

  const maandLabel = `${MAANDEN[weekDagen[0].getMonth()]} ${weekDagen[0].getFullYear()}`;

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard"
            className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-black text-xl">Mijn agenda</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {gereserveerd} geboekt
              {overschreden > 0 && <span style={{ color: "#dc2626" }}> · {overschreden} ⚠ verlaat</span>}
            </p>
          </div>
          {activeTab === "agenda" && (
            <button onClick={() => setShowBeschikbaar(true)}
              className="touch-scale flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "var(--teal)" }}>
              <Plus size={15} /> Vrij
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--surface-2)" }}>
          {(["agenda", "schema"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="touch-scale flex-1 py-2.5 rounded-xl font-semibold text-xs capitalize transition-all"
              style={{
                background: activeTab === t ? "white" : "transparent",
                color: activeTab === t ? "var(--foreground)" : "var(--muted)",
                boxShadow: activeTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {t === "agenda" ? "📅 Agenda" : "⚙️ Werkschema"}
            </button>
          ))}
        </div>

        {/* Week navigator — alleen bij agenda tab */}
        {activeTab === "agenda" && (
          <>
            <div className="flex items-center gap-2 mt-3 mb-3">
              <button onClick={prevWeek} className="touch-scale w-8 h-8 card rounded-full flex items-center justify-center">
                <ChevronLeft size={16} />
              </button>
              <p className="flex-1 text-center font-bold text-sm capitalize">{maandLabel}</p>
              <button onClick={nextWeek} className="touch-scale w-8 h-8 card rounded-full flex items-center justify-center">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Dag pills */}
            <div className="grid grid-cols-7 gap-1">
              {weekDagen.map((dag, i) => {
                const ymd = toYMD(dag);
                const heeftSlot = slots.some(s => s.datum === ymd);
                const heeftGeboekt = slots.some(s => s.datum === ymd && s.status === "gereserveerd");
                const isSelected = ymd === selectedDay;
                const isVandaag = ymd === toYMD(new Date());
                return (
                  <button key={i} onClick={() => setSelectedDay(ymd)}
                    className="touch-scale flex flex-col items-center gap-1 py-2 rounded-2xl transition-all"
                    style={{ background: isSelected ? "var(--teal)" : "transparent" }}>
                    <span className="text-[10px] font-semibold"
                      style={{ color: isSelected ? "white" : "var(--muted)" }}>
                      {DAG_LABELS[(i + 1) % 7] === "Zo" ? "Zo" : DAG_LABELS[i + 1] || "Zo"}
                    </span>
                    <span className="font-black text-sm"
                      style={{ color: isSelected ? "white" : isVandaag ? "var(--teal)" : "var(--foreground)" }}>
                      {dag.getDate()}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: isSelected ? "rgba(255,255,255,0.6)"
                          : heeftGeboekt ? "var(--teal)"
                          : heeftSlot ? "#22c55e"
                          : "transparent"
                      }} />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3">
        {/* Agenda tab */}
        {activeTab === "agenda" && (
          <>
            {/* Legenda */}
            <div className="flex flex-wrap gap-3">
              {[
                { color: "var(--teal)", label: "Geboekt" },
                { color: "#22c55e", label: "Beschikbaar" },
                { color: "#f59e0b", label: "Buffer" },
                { color: "#64748b", label: "Bezet" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Beschikbaarheid form */}
            {showBeschikbaar && (
              <BeschikbaarheidForm
                datum={selectedDay}
                onSave={(newSlots) => {
                  setSlots(s => [...s, ...newSlots]);
                  setShowBeschikbaar(false);
                }}
                onCancel={() => setShowBeschikbaar(false)}
              />
            )}

            {/* Dag agenda */}
            <div>
              <p className="font-black text-sm mb-3">
                {new Date(selectedDay + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
              </p>

              {daagSlots.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">📅</p>
                  <p className="font-bold text-sm">Niets gepland</p>
                  <p className="text-xs mt-1 mb-4" style={{ color: "var(--muted)" }}>
                    Voeg beschikbare tijden toe zodat klanten kunnen boeken
                  </p>
                  <button onClick={() => setShowBeschikbaar(true)}
                    className="touch-scale px-5 py-2.5 rounded-2xl font-bold text-white text-sm"
                    style={{ background: "var(--teal)" }}>
                    + Beschikbaarheid toevoegen
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {daagSlots.map(slot => (
                    <SlotKaart key={slot.id} slot={slot} diensten={MOCK_DIENSTEN} />
                  ))}

                  {(() => {
                    const geboekteSlots = daagSlots.filter(s => s.status === "gereserveerd");
                    const totalGeboekt = geboekteSlots.reduce((t, s) =>
                      t + tijdNaarMinuten(s.eind) - tijdNaarMinuten(s.start), 0);
                    const totalBuffer = geboekteSlots.reduce((t, s) => t + (s.reistijdNa || 0), 0);
                    if (geboekteSlots.length === 0) return null;
                    return (
                      <div className="mt-2 p-4 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                        <p className="font-bold text-xs mb-3" style={{ color: "var(--muted)" }}>Dagoverzicht</p>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="font-black text-xl" style={{ color: "var(--teal)" }}>{geboekteSlots.length}</p>
                            <p className="text-[10px]" style={{ color: "var(--muted)" }}>Klussen</p>
                          </div>
                          <div>
                            <p className="font-black text-xl">{Math.round(totalGeboekt / 60 * 10) / 10}u</p>
                            <p className="text-[10px]" style={{ color: "var(--muted)" }}>Werktijd</p>
                          </div>
                          <div>
                            <p className="font-black text-xl" style={{ color: "#d97706" }}>{totalBuffer}m</p>
                            <p className="text-[10px]" style={{ color: "var(--muted)" }}>Reistijd</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Klant boekingslink */}
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--teal)" + "15" }}>
                <Zap size={18} style={{ color: "var(--teal)" }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Boekingspagina delen</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Klanten boeken direct een tijdslot</p>
              </div>
              <Link href="/agenda/boeken/marco"
                className="touch-scale px-3 py-2 rounded-xl font-bold text-xs"
                style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
                Bekijk
              </Link>
            </div>
          </>
        )}

        {/* Schema tab */}
        {activeTab === "schema" && <WerkschemaTab />}
      </div>
    </div>
  );
}
