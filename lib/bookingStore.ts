import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Booking = {
  id: string;
  vakmanId: string;
  vakmanNaam: string;
  vakmanAvatar: string;
  dienst: string;
  datum: string;   // "2026-05-28"
  tijd: string;    // "10:00"
  tijdEind: string;
  omschrijving: string;
  prijs: number;
  eenheid: string;
  status: "bevestigd" | "afgerond" | "geannuleerd";
  reviewGegeven: boolean;
  createdAt: string;
};

type BookingStore = {
  boekingen: Booking[];
  voegBoeking: (b: Omit<Booking, "id" | "createdAt">) => string;
  markeerAfgerond: (id: string) => void;
  markeerReviewGegeven: (id: string) => void;
  annuleer: (id: string) => void;
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      boekingen: [],
      voegBoeking: (b) => {
        const id = `bk_${Date.now()}`;
        set(s => ({
          boekingen: [...s.boekingen, { ...b, id, createdAt: new Date().toISOString() }],
        }));
        return id;
      },
      markeerAfgerond: (id) =>
        set(s => ({ boekingen: s.boekingen.map(b => b.id === id ? { ...b, status: "afgerond" } : b) })),
      markeerReviewGegeven: (id) =>
        set(s => ({ boekingen: s.boekingen.map(b => b.id === id ? { ...b, reviewGegeven: true } : b) })),
      annuleer: (id) =>
        set(s => ({ boekingen: s.boekingen.map(b => b.id === id ? { ...b, status: "geannuleerd" } : b) })),
    }),
    { name: "servr-boekingen" }
  )
);
