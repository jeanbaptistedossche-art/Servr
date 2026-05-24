import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Notificatie = {
  id: string;
  type: "betaling_ontvangen";
  titel: string;
  bericht: string;
  /** Bedrag dat de vakman netto ontvangt (na Servr fee) */
  vakmanOntvangt: number;
  /** Bedrag dat de klant heeft betaald (incl. 5% service fee) */
  klantBetaald: number;
  /** Origineel vakman-tarief */
  vakmanTarief: number;
  offerte: string;
  timestamp: string;
  gelezen: boolean;
};

type State = {
  notificaties: Notificatie[];
  addNotificatie: (n: Omit<Notificatie, "id" | "timestamp" | "gelezen">) => void;
  markeerGelezen: (id: string) => void;
  markeerAllesGelezen: () => void;
  reset: () => void;
};

export const useNotificatieStore = create<State>()(
  persist(
    (set) => ({
      notificaties: [],

      addNotificatie: (n) =>
        set((s) => ({
          notificaties: [
            {
              ...n,
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              timestamp: new Date().toISOString(),
              gelezen: false,
            },
            ...s.notificaties,
          ],
        })),

      markeerGelezen: (id) =>
        set((s) => ({
          notificaties: s.notificaties.map((n) =>
            n.id === id ? { ...n, gelezen: true } : n
          ),
        })),

      markeerAllesGelezen: () =>
        set((s) => ({
          notificaties: s.notificaties.map((n) => ({ ...n, gelezen: true })),
        })),

      reset: () => set({ notificaties: [] }),
    }),
    { name: "servr-notificaties-v1" }
  )
);
