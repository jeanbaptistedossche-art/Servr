import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  accountId: string | null;
  onboarded: boolean;
  /** Sla account ID op (wordt ook als onboarded gemarkeerd) */
  setAccountId: (id: string) => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;
};

export const useStripeConnectStore = create<State>()(
  persist(
    (set) => ({
      accountId: null,
      onboarded: false,
      setAccountId: (accountId) => set({ accountId, onboarded: true }),
      setOnboarded: (onboarded) => set({ onboarded }),
      reset: () => set({ accountId: null, onboarded: false }),
    }),
    { name: "servr-stripe-connect-v1" }
  )
);
