import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Review = {
  id: string;
  vakmanId: string;
  boekingId: string;
  auteur: string;
  rating: number;
  tekst: string;
  datum: string;
};

type ReviewStore = {
  reviews: Review[];
  voegReview: (r: Omit<Review, "id" | "datum">) => void;
  getReviewsVoorVakman: (vakmanId: string) => Review[];
  heeftReview: (boekingId: string) => boolean;
};

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],
      voegReview: (r) =>
        set(s => ({
          reviews: [
            ...s.reviews,
            {
              ...r,
              id: `rv_${Date.now()}`,
              datum: new Date().toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            },
          ],
        })),
      getReviewsVoorVakman: (vakmanId) =>
        get().reviews.filter(r => r.vakmanId === vakmanId),
      heeftReview: (boekingId) =>
        get().reviews.some(r => r.boekingId === boekingId),
    }),
    { name: "servr-reviews" }
  )
);
