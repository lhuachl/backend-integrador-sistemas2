import { create } from 'zustand';
import { client } from '@/lib/api/client';
import type { Goal } from '@/lib/api/mock/data';

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  create: (userId: string, body: { title: string; description?: string; target: number; unit: string }) => Promise<Goal | null>;
  save: (id: string, body: { title?: string; target?: number; unit?: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addProgress: (id: string, amount: number) => Promise<void>;
}

export const useGoals = create<GoalsState>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  load: async (userId) => {
    set({ loading: true });
    try {
      const goals = await client.listGoals(userId);
      set({ goals, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown', loading: false });
    }
  },

  create: async (userId, body) => {
    try {
      const goal = await client.createGoal(userId, body);
      set({ goals: [...get().goals, goal] });
      return goal;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
      return null;
    }
  },

  save: async (id, body) => {
    try {
      const updated = await client.updateGoal(id, body);
      set({ goals: get().goals.map((g) => (g.id === id ? updated : g)) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
    }
  },

  remove: async (id) => {
    await client.deleteGoal(id);
    set({ goals: get().goals.filter((g) => g.id !== id) });
  },

  addProgress: async (id, amount) => {
    try {
      const updated = await client.addProgress(id, amount);
      set({ goals: get().goals.map((g) => (g.id === id ? updated : g)) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
    }
  },
}));
