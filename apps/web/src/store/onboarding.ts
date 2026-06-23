import { create } from "zustand";

const KEY = "flowstate_onboarding";

interface OnboardingState {
  completed: boolean;
  check: () => void;
  finish: () => void;
}

export const useOnboarding = create<OnboardingState>((set) => ({
  completed: false,

  check: () => {
    try {
      const val = localStorage.getItem(KEY);
      set({ completed: val === "1" });
    } catch {
      set({ completed: false });
    }
  },

  finish: () => {
    set({ completed: true });
    try { localStorage.setItem(KEY, "1"); } catch {}
  },
}));
