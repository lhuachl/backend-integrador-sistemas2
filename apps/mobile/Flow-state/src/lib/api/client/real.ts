import axios, { type AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiClient, AuthResponse, LoginBody, RegisterBody, GoogleBody, VerifyBody, NoteCreateBody, NoteUpdateBody, GoalCreateBody, GoalUpdateBody, TaskCreateBody, TaskUpdateBody, TeamCreateBody, InviteBody, ActivityStats } from './types';
import type { User, InternalUser, Team, TeamMember, Note, NoteLink, Goal, Task, GraphData, Notification } from '../mock/data';

const TOKEN_KEY = 'flowstate_tokens';

let api: AxiosInstance | null = null;

function getApi(): AxiosInstance {
  if (!api) {
    const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
    api = axios.create({ baseURL, timeout: 10000 });

    api.interceptors.request.use(async (config) => {
      try {
        const raw = await SecureStore.getItemAsync(TOKEN_KEY);
        if (raw) {
          const tokens = JSON.parse(raw);
          config.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
      } catch {}
      return config;
    });

    api.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            const raw = await SecureStore.getItemAsync(TOKEN_KEY);
            if (raw) {
              const tokens = JSON.parse(raw);
              const res = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: tokens.refresh_token });
              const newTokens = res.data;
              await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(newTokens));
              error.config.headers.Authorization = `Bearer ${newTokens.access_token}`;
              return axios(error.config);
            }
          } catch {}
        }
        throw error;
      },
    );
  }
  return api;
}

async function persist(tokens: { access_token: string; refresh_token: string; expires_in: number }) {
  try { await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens)); } catch {}
}

export const realClient: ApiClient = {
  findUserByEmail(_email: string): InternalUser | null {
    return null;
  },

  login: async (b) => {
    const { data } = await getApi().post<AuthResponse>('/auth/login', b);
    await persist(data.tokens);
    return data;
  },
  register: async (b) => {
    const { data } = await getApi().post<AuthResponse>('/auth/register', b);
    await persist(data.tokens);
    return data;
  },
  googleAuth: async (b) => {
    const { data } = await getApi().post<AuthResponse>('/auth/google', b);
    await persist(data.tokens);
    return data;
  },
  verifyEmail: async (b) => {
    const { data } = await getApi().post<AuthResponse>('/auth/verify-email', b);
    await persist(data.tokens);
    return data;
  },
  updateProfile: async (userId, body) => {
    const { data } = await getApi().patch<User>('/users/me/profile', body);
    return data;
  },
  getMe: async (userId) => {
    const { data } = await getApi().get<User>('/auth/me');
    return data;
  },
  logout: async () => {
    await getApi().post('/auth/logout');
    try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
  },
  refresh: async (refreshToken) => {
    const { data } = await getApi().post<{ access_token: string; refresh_token: string; expires_in: number }>('/auth/refresh', { refresh_token: refreshToken });
    return data;
  },
  getUser: async (id) => {
    const { data } = await getApi().get<User>(`/users/${id}`);
    return data;
  },
  joinTeam: async (teamId, userId, token) => {
    const { data } = await getApi().post<TeamMember>(`/teams/${teamId}/join`, { token });
    return data;
  },
  addExplicitLink: async (noteId, targetTitle) => {
    const { data } = await getApi().post<NoteLink | null>(`/notes/${noteId}/links`, { target_title: targetTitle });
    return data;
  },

  listNotes: async (userId, opts) => {
    const params: Record<string, string> = {};
    if (opts?.teamId) params.team_id = opts.teamId;
    if (opts?.q) params.q = opts.q;
    if (opts?.tag) params.tag = opts.tag;
    const { data } = await getApi().get<Note[]>('/notes', { params });
    return data;
  },
  getNote: async (id) => {
    const { data } = await getApi().get<Note>(`/notes/${id}`);
    return data;
  },
  createNote: async (userId, body) => {
    const { data } = await getApi().post<Note>('/notes', body);
    return data;
  },
  updateNote: async (id, body) => {
    const { data } = await getApi().patch<Note>(`/notes/${id}`, body);
    return data;
  },
  deleteNote: async (id) => {
    await getApi().delete(`/notes/${id}`);
  },
  getNoteLinks: async (id) => {
    const { data } = await getApi().get<NoteLink[]>(`/notes/${id}/links`);
    return data;
  },
  getBacklinks: async (title) => {
    const { data } = await getApi().get<NoteLink[]>('/notes', { params: { backlink_title: title } });
    return data;
  },
  shareNoteToTeam: async (noteId, teamId) => {
    const { data } = await getApi().post<Note>(`/notes/${noteId}/share`, { team_id: teamId });
    return data;
  },

  listGoals: async (userId) => {
    const { data } = await getApi().get<Goal[]>('/goals');
    return data;
  },
  getGoal: async (id) => {
    const { data } = await getApi().get<Goal>(`/goals/${id}`);
    return data;
  },
  createGoal: async (userId, body) => {
    const { data } = await getApi().post<Goal>('/goals', body);
    return data;
  },
  updateGoal: async (id, body) => {
    const { data } = await getApi().patch<Goal>(`/goals/${id}`, body);
    return data;
  },
  deleteGoal: async (id) => {
    await getApi().delete(`/goals/${id}`);
  },
  addProgress: async (goalId, amount) => {
    const { data } = await getApi().post<Goal>(`/goals/${goalId}/progress`, { amount });
    return data;
  },

  listTasks: async (userId, opts) => {
    const params: Record<string, string> = {};
    if (opts?.goalId) params.goal_id = opts.goalId;
    if (opts?.status) params.status = opts.status;
    const { data } = await getApi().get<Task[]>('/tasks', { params });
    return data;
  },
  createTask: async (userId, body) => {
    const { data } = await getApi().post<Task>('/tasks', body);
    return data;
  },
  updateTask: async (id, body) => {
    const { data } = await getApi().patch<Task>(`/tasks/${id}`, body);
    return data;
  },
  deleteTask: async (id) => {
    await getApi().delete(`/tasks/${id}`);
  },

  listTeams: async (userId) => {
    const { data } = await getApi().get<Team[]>('/teams');
    return data;
  },
  getTeam: async (id) => {
    const { data } = await getApi().get<Team>(`/teams/${id}`);
    return data;
  },
  createTeam: async (userId, body) => {
    const { data } = await getApi().post<Team>('/teams', body);
    return data;
  },
  listTeamMembers: async (teamId) => {
    const { data } = await getApi().get<Array<TeamMember & { name: string; email: string }>>(`/teams/${teamId}/members`);
    return data;
  },
  inviteMember: async (teamId, body) => {
    const { data } = await getApi().post<TeamMember>(`/teams/${teamId}/members`, body);
    return data;
  },

  getGraph: async (userId, teamId) => {
    const { data } = await getApi().get<GraphData>('/graph', { params: { team_id: teamId } });
    return data;
  },

  listNotifications: async (userId) => {
    const { data } = await getApi().get<Notification[]>('/notifications');
    return data;
  },
  markNotificationsRead: async (ids) => {
    await getApi().patch('/notifications', { ids });
  },

  getActivityDates: async () => ({ data: [] } as any),
  computeStreak: async () => 0,
  getWeekActivity: async () => [],
  getActivityStats: async (userId) => {
    const { data } = await getApi().get<ActivityStats>('/activity/stats');
    return data;
  },
};
