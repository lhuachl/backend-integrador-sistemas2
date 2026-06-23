import { create } from 'zustand';
import { client } from '@/lib/api/client';
import type { Task } from '@/lib/api/mock/data';

type TaskStatus = 'todo' | 'in_progress' | 'done';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  load: (userId: string, opts?: { goalId?: string; status?: TaskStatus }) => Promise<void>;
  create: (userId: string, body: { title: string; goal_id?: string | null }) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  setStatus: (id: string, status: TaskStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  load: async (userId, opts) => {
    set({ loading: true });
    try {
      const tasks = await client.listTasks(userId, opts);
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown', loading: false });
    }
  },

  create: async (userId, body) => {
    try {
      const task = await client.createTask(userId, body);
      set({ tasks: [task, ...get().tasks] });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
    }
  },

  toggle: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    let next: TaskStatus;
    if (task.status === 'todo') next = 'in_progress';
    else if (task.status === 'in_progress') next = 'done';
    else next = 'todo';
    await get().setStatus(id, next);
  },

  setStatus: async (id, status) => {
    try {
      const updated = await client.updateTask(id, { status });
      set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
    }
  },

  remove: async (id) => {
    await client.deleteTask(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },
}));
