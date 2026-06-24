import type { ApiClient, AuthResponse, LoginBody, RegisterBody, GoogleBody, VerifyBody, NoteCreateBody, NoteUpdateBody, GoalCreateBody, GoalUpdateBody, TaskCreateBody, TaskUpdateBody, TeamCreateBody, InviteBody, ActivityStats } from "./types";
import type { User, InternalUser, Team, TeamMember, Note, NoteLink, Goal, Task, GraphData, Notification } from "../mock/data";

const TOKEN_KEY = "flowstate_tokens";
const baseURL = "http://localhost:3000/api/v1";

async function getBaseURL(): Promise<string> {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return baseURL;
}

function getStoredTokens(): { access_token: string; refresh_token: string; expires_in: number; user_id?: string } | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(tokens: { access_token: string; refresh_token: string; expires_in: number }) {
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens)); } catch {}
}

function clearPersist() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const url = `${await getBaseURL()}${path}`;
  const tokens = getStoredTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    if (res.status === 401 && tokens?.refresh_token) {
      const refreshRes = await fetch(`${await getBaseURL()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });
      if (refreshRes.ok) {
        const newTokens = await refreshRes.json();
        persist(newTokens);
        headers["Authorization"] = `Bearer ${newTokens.access_token}`;
        const retryRes = await fetch(url, { ...opts, headers });
        if (retryRes.status === 204) return undefined as T;
        if (!retryRes.ok) throw new Error(`API error: ${retryRes.status}`);
        return retryRes.json() as T;
      }
      clearPersist();
    }
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as T;
}

export const realClient: ApiClient = {
  findUserByEmail(_email: string): InternalUser | null {
    return null;
  },

  login: async (b) => {
    const data = await request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(b) });
    persist(data.tokens);
    return data;
  },
  register: async (b) => {
    const data = await request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(b) });
    persist(data.tokens);
    return data;
  },
  googleAuth: async (b) => {
    const data = await request<AuthResponse>("/auth/google", { method: "POST", body: JSON.stringify(b) });
    persist(data.tokens);
    return data;
  },
  verifyEmail: async (b) => {
    const data = await request<AuthResponse>("/auth/verify-email", { method: "POST", body: JSON.stringify(b) });
    persist(data.tokens);
    return data;
  },
  updateProfile: async (_userId, body) => {
    return request<User>("/users/me/profile", { method: "PATCH", body: JSON.stringify(body) });
  },
  getMe: async (_userId) => {
    return request<User>("/auth/me");
  },
  logout: async () => {
    await request<void>("/auth/logout", { method: "POST" });
    clearPersist();
  },
  refresh: async (refreshToken) => {
    return request<{ access_token: string; refresh_token: string; expires_in: number }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
  getUser: async (id) => {
    return request<User>(`/users/${id}`);
  },
  joinTeam: async (teamId, _userId, token) => {
    return request<TeamMember>(`/teams/${teamId}/join`, { method: "POST", body: JSON.stringify({ token }) });
  },
  addExplicitLink: async (noteId, targetTitle) => {
    return request<NoteLink | null>(`/notes/${noteId}/links`, {
      method: "POST",
      body: JSON.stringify({ target_title: targetTitle }),
    });
  },

  listNotes: async (_userId, opts) => {
    const params = new URLSearchParams();
    if (opts?.teamId) params.set("team_id", opts.teamId);
    if (opts?.q) params.set("q", opts.q);
    if (opts?.tag) params.set("tag", opts.tag);
    const qs = params.toString();
    return request<Note[]>(`/notes${qs ? "?" + qs : ""}`);
  },
  getNote: async (id) => {
    return request<Note>(`/notes/${id}`);
  },
  createNote: async (_userId, body) => {
    return request<Note>("/notes", { method: "POST", body: JSON.stringify(body) });
  },
  updateNote: async (id, body) => {
    return request<Note>(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteNote: async (id) => {
    await request<void>(`/notes/${id}`, { method: "DELETE" });
  },
  getNoteLinks: async (id) => {
    return request<NoteLink[]>(`/notes/${id}/links`);
  },
  getBacklinks: async (title) => {
    return request<NoteLink[]>(`/notes?backlink_title=${encodeURIComponent(title)}`);
  },
  shareNoteToTeam: async (noteId, teamId) => {
    return request<Note>(`/notes/${noteId}/share`, { method: "POST", body: JSON.stringify({ team_id: teamId }) });
  },

  listGoals: async (_userId) => {
    return request<Goal[]>("/goals");
  },
  getGoal: async (id) => {
    return request<Goal>(`/goals/${id}`);
  },
  createGoal: async (_userId, body) => {
    return request<Goal>("/goals", { method: "POST", body: JSON.stringify(body) });
  },
  updateGoal: async (id, body) => {
    return request<Goal>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteGoal: async (id) => {
    await request<void>(`/goals/${id}`, { method: "DELETE" });
  },
  addProgress: async (goalId, amount) => {
    return request<Goal>(`/goals/${goalId}/progress`, { method: "POST", body: JSON.stringify({ amount }) });
  },

  listTasks: async (_userId, opts) => {
    const params = new URLSearchParams();
    if (opts?.goalId) params.set("goal_id", opts.goalId);
    if (opts?.status) params.set("status", opts.status);
    const qs = params.toString();
    return request<Task[]>(`/tasks${qs ? "?" + qs : ""}`);
  },
  createTask: async (_userId, body) => {
    return request<Task>("/tasks", { method: "POST", body: JSON.stringify(body) });
  },
  updateTask: async (id, body) => {
    return request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteTask: async (id) => {
    await request<void>(`/tasks/${id}`, { method: "DELETE" });
  },

  listTeams: async (_userId) => {
    return request<Team[]>("/teams");
  },
  getTeam: async (id) => {
    return request<Team>(`/teams/${id}`);
  },
  createTeam: async (_userId, body) => {
    return request<Team>("/teams", { method: "POST", body: JSON.stringify(body) });
  },
  listTeamMembers: async (teamId) => {
    return request<Array<TeamMember & { name: string; email: string }>>(`/teams/${teamId}/members`);
  },
  inviteMember: async (teamId, body) => {
    return request<TeamMember>(`/teams/${teamId}/members`, { method: "POST", body: JSON.stringify(body) });
  },

  getGraph: async (_userId, teamId) => {
    const params = teamId ? `?team_id=${teamId}` : "";
    return request<GraphData>(`/graph${params}`);
  },

  listNotifications: async (_userId) => {
    return request<Notification[]>("/notifications");
  },
  markNotificationsRead: async (ids) => {
    await request<void>("/notifications", { method: "PATCH", body: JSON.stringify({ ids }) });
  },

  getActivityDates: async () => Promise.resolve([]),
  computeStreak: async () => Promise.resolve(0),
  getWeekActivity: async () => Promise.resolve([]),
  getActivityStats: async (_userId) => {
    return request<ActivityStats>("/activity/stats");
  },
};
