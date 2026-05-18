import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genereerBeschikbareSlots, type AgendaSlot, type Dienst } from "./bedrijfStore";

export type PauzeSlot = { start: string; eind: string };

export type DagSchema = {
  actief: boolean;
  start: string;
  eind: string;
  pauzes: PauzeSlot[];
};

// Index 0 = Zondag, 1 = Maandag, ... 6 = Zaterdag (matcht Date.getDay())
export type WerkSchema = DagSchema[];

const defaultDag = (actief: boolean, pauze = true): DagSchema => ({
  actief,
  start: "08:00",
  eind: "18:00",
  pauzes: pauze ? [{ start: "12:30", eind: "13:30" }] : [],
});

export const DEFAULT_SCHEMA: WerkSchema = [
  defaultDag(false, false), // 0 = Zo
  defaultDag(true),          // 1 = Ma
  defaultDag(true),          // 2 = Di
  defaultDag(true),          // 3 = Wo
  defaultDag(true),          // 4 = Do
  defaultDag(true),          // 5 = Vr
  defaultDag(false, false),  // 6 = Za
];

export const DAG_LABELS = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
export const DAG_LABELS_LANG = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

type AgendaStoreState = {
  schema: WerkSchema;
  setDag: (dag: number, updates: Partial<DagSchema>) => void;
  addPauze: (dag: number, pauze: PauzeSlot) => void;
  removePauze: (dag: number, index: number) => void;
};

export const useAgendaStore = create<AgendaStoreState>()(
  persist(
    (set) => ({
      schema: DEFAULT_SCHEMA,
      setDag: (dag, updates) =>
        set(s => {
          const newSchema = [...s.schema];
          newSchema[dag] = { ...newSchema[dag], ...updates };
          return { schema: newSchema };
        }),
      addPauze: (dag, pauze) =>
        set(s => {
          const newSchema = [...s.schema];
          newSchema[dag] = { ...newSchema[dag], pauzes: [...newSchema[dag].pauzes, pauze] };
          return { schema: newSchema };
        }),
      removePauze: (dag, index) =>
        set(s => {
          const newSchema = [...s.schema];
          newSchema[dag] = {
            ...newSchema[dag],
            pauzes: newSchema[dag].pauzes.filter((_, i) => i !== index),
          };
          return { schema: newSchema };
        }),
    }),
    { name: "servr-werkschema" }
  )
);

/**
 * Genereer beschikbare slots op basis van werkschema + bestaande boekingen.
 * Pauzes worden als blokkering behandeld.
 */
export function getSlotsForDate(
  datum: string,
  dienst: Dienst,
  bestaandeSlots: AgendaSlot[],
  schema: WerkSchema
): { start: string; eind: string; beschikbaar: boolean }[] {
  const date = new Date(datum + "T12:00:00");
  const dayOfWeek = date.getDay();
  const dagSchema = schema[dayOfWeek];

  if (!dagSchema || !dagSchema.actief) return [];

  // Zet pauzes om naar bezet-slots
  const pauzeSlots: AgendaSlot[] = dagSchema.pauzes.map((p, i) => ({
    id: `pauze-${datum}-${i}`,
    datum,
    start: p.start,
    eind: p.eind,
    status: "bezet" as const,
  }));

  return genereerBeschikbareSlots(
    datum,
    dienst,
    [...bestaandeSlots, ...pauzeSlots],
    dagSchema.start,
    dagSchema.eind
  );
}
