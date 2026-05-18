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

// 2 openstaande offertes voor de demo (klant = "Jeanb")
const MOCK_START: VerstuurdeOfferte[] = [
  {
    id: "vo1",
    nummer: "OFF-1040",
    datum: "15 mei 2026",
    geldigTot: "29 mei 2026",
    vakmanNaam: "Marco van den Berg",
    vakmanAvatar: "https://i.pravatar.cc/150?img=11",
    vakmanChatId: "p1",
    klantNaam: "Jeanb",
    klantAvatar: "https://i.pravatar.cc/150?img=68",
    regels: [
      { id: "r1", omschrijving: "Lekkage reparatie keuken", aantal: 1, eenheid: "klus", prijsPerEenheid: 75, btwPercentage: 0 },
      { id: "r2", omschrijving: "Afdichtingsmateriaal", aantal: 1, eenheid: "stuk", prijsPerEenheid: 10, btwPercentage: 0 },
    ],
    subtotaal: 85,
    totaalBtw: 0,
    totaal: 85,
    notities: "Inclusief 3 maanden garantie op het werk.",
    status: "openstaand",
    aangemaakt: "15 mei 2026",
  },
  {
    id: "vo2",
    nummer: "OFF-1041",
    datum: "16 mei 2026",
    geldigTot: "30 mei 2026",
    vakmanNaam: "Sofia Martins",
    vakmanAvatar: "https://i.pravatar.cc/150?img=47",
    vakmanChatId: "p2",
    klantNaam: "Jeanb",
    klantAvatar: "https://i.pravatar.cc/150?img=68",
    regels: [
      { id: "r1", omschrijving: "Grondige schoonmaak appartement", aantal: 3, eenheid: "uur", prijsPerEenheid: 32, btwPercentage: 0 },
    ],
    subtotaal: 96,
    totaalBtw: 0,
    totaal: 96,
    notities: "",
    status: "openstaand",
    aangemaakt: "16 mei 2026",
  },
];

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
    { name: "servr-offertes-v2" }
  )
);
