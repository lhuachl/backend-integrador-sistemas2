import { create } from 'zustand';

const KEY = 'flowstate_onboarding';

interface OnboardingState {
  completed: boolean;
  check: () => Promise<void>;
  finish: () => void;
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
  completed: false,

  check: async () => {
    try {
      const { default: SecureStore } = await import('expo-secure-store');
      const val = await SecureStore.getItemAsync(KEY);
      set({ completed: val === '1' });
    } catch {
      set({ completed: false });
    }
  },

  finish: () => {
    set({ completed: true });
    import('expo-secure-store').then((SecureStore) => {
      SecureStore.setItemAsync(KEY, '1').catch(() => {});
    });
  },
}));
