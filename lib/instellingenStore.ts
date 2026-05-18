import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BetaalMethodeType = "creditcard" | "ideal" | "bancontact" | "iban";

export type BetaalMethode = {
  id: string;
  type: BetaalMethodeType;
  label: string;        // "Visa •••• 4521" / "ING iDEAL" / "NL91 •••• 00"
  icoon: string;
  // Creditcard
  last4?: string;
  kaarthouder?: string;
  vervaldatum?: string; // MM/JJ
  kaartMerk?: string;   // "Visa" | "Mastercard"
  // iDEAL / Bancontact
  bankNaam?: string;
  // IBAN
  ibanGemaskeerd?: string; // "NL91 ABNA •••• •••• 00"
  rekeninghouder?: string;
};

type InstellingenState = {
  darkMode: boolean;
  taal: "nl" | "en" | "fr";
  toggles: Record<string, boolean>;
  betaalmethoden: BetaalMethode[];
  setDarkMode: (v: boolean) => void;
  setTaal: (t: "nl" | "en" | "fr") => void;
  setToggle: (key: string, value: boolean) => void;
  voegBetaalMethodeToe: (m: Omit<BetaalMethode, "id">) => void;
  verwijderBetaalMethode: (id: string) => void;
};

const DEFAULT_TOGGLES: Record<string, boolean> = {
  push_boeking: true,
  push_bericht: true,
  push_betaling: true,
  push_herinnering: false,
  email_nieuws: false,
  locatie: true,
  online_status: true,
  profiel_zichtbaar: true,
};

export const useInstellingenStore = create<InstellingenState>()(
  persist(
    (set) => ({
      darkMode: false,
      taal: "nl",
      toggles: DEFAULT_TOGGLES,
      betaalmethoden: [],
      setDarkMode: (v) => set({ darkMode: v }),
      setTaal: (t) => set({ taal: t }),
      setToggle: (key, value) =>
        set((state) => ({ toggles: { ...state.toggles, [key]: value } })),
      voegBetaalMethodeToe: (m) =>
        set((state) => ({
          betaalmethoden: [
            ...state.betaalmethoden,
            { ...m, id: `bm-${Date.now()}` },
          ],
        })),
      verwijderBetaalMethode: (id) =>
        set((state) => ({
          betaalmethoden: state.betaalmethoden.filter((m) => m.id !== id),
        })),
    }),
    { name: "servr-instellingen-v1" }
  )
);
