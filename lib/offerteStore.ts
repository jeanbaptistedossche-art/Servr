import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OfferteRegel } from "./bedrijfStore";

export type VerstuurdeOfferte = {
  id: string;
  nummer: string;
  datum: string;
  geldigTot: string;
  vakmanNaam: string;
  vakmanAvatar: string;
  vakmanChatId: string;
  klantNaam: string;
  klantAvatar: string;
  regels: OfferteRegel[];
  subtotaal: number;
  totaalBtw: number;
  totaal: number;
  notities: string;
  status: "openstaand" | "betaald" | "verlopen" | "geweigerd";
  aangemaakt: string;
};

type OfferteStoreState = {
  offertes: VerstuurdeOfferte[];
  verstuurOfferte: (o: Omit<VerstuurdeOfferte, "id" | "status" | "aangemaakt">) => void;
  betaalOfferte: (id: string) => void;
  weigerOfferte: (id: string) => void;
};

// Lege startlijst — offertes worden toegevoegd via echte acceptaties
const MOCK_START: VerstuurdeOfferte[] = [];

export const useOfferteStore = create<OfferteStoreState>()(
  persist(
    (set) => ({
      offertes: MOCK_START,
      verstuurOfferte: (o) =>
        set((state) => ({
          offertes: [
            {
              ...o,
              id: `vo-${Date.now()}`,
              status: "openstaand",
              aangemaakt: new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
            },
            ...state.offertes,
          ],
        })),
      betaalOfferte: (id) =>
        set((state) => ({
          offertes: state.offertes.map((o) => o.id === id ? { ...o, status: "betaald" } : o),
        })),
      weigerOfferte: (id) =>
        set((state) => ({
          offertes: state.offertes.map((o) => o.id === id ? { ...o, status: "geweigerd" } : o),
        })),
    }),
    { name: "servr-offertes-v4" }
  )
);
