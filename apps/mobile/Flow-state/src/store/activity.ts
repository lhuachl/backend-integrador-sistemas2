import { create } from 'zustand';
import { client } from '@/lib/api/client';

interface ActivityState {
  streak: number;
  week: Array<{ date: string; active: boolean }>;
  tasksDone: number;
  tasksTotal: number;
  goalsCompleted: number;
  load: (userId: string) => Promise<void>;
}

export const useActivity = create<ActivityState>((set) => ({
  streak: 0,
  week: [],
  tasksDone: 0,
  tasksTotal: 0,
  goalsCompleted: 0,

  load: async (userId) => {
    const [stats, week] = await Promise.all([
      client.getActivityStats(userId),
      client.getWeekActivity(),
    ]);
    set({
      streak: stats.streak,
      week,
      tasksDone: stats.tasksDone,
      tasksTotal: stats.tasksTotal,
      goalsCompleted: stats.goalsCompleted,
    });
  },
}));
