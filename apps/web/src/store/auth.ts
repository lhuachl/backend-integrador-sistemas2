import { create } from "zustand";
import { client } from "@/lib/api/client";
import type { User, LoginBody, RegisterBody, VerifyBody } from "@/lib/api/client";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  pendingEmail: string | null;
  isSignUp: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (body: LoginBody) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  google: (idToken: string) => Promise<void>;
  verify: (body: VerifyBody) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  clearPending: () => void;
}

const TOKEN_KEY = "flowstate_tokens";

function persist(tokens: { access_token: string; refresh_token: string; expires_in: number }, userId: string) {
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...tokens, user_id: userId })); } catch {}
}

function clearPersist() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

function getStored() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  pendingEmail: null,
  isSignUp: false,
  initialized: false,

  init: async () => {
    set({ loading: true });
    try {
      const stored = getStored();
      if (stored?.user_id) {
        const user = await client.getMe(stored.user_id);
        if (user) set({ user });
      }
    } catch {}
    set({ initialized: true, loading: false });
  },

  login: async (body) => {
    set({ loading: true, error: null });
    try {
      const res = await client.login(body);
      if (res.requires_verification) {
        set({ pendingEmail: body.email, isSignUp: false });
        return;
      }
      persist(res.tokens, res.user.id);
      set({ user: res.user, pendingEmail: null, isSignUp: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "unknown_error" });
    } finally {
      set({ loading: false });
    }
  },

  register: async (body) => {
    set({ loading: true, error: null });
    try {
      const res = await client.register(body);
      if (res.requires_verification) {
        set({ pendingEmail: body.email, isSignUp: true });
        return;
      }
      persist(res.tokens, res.user.id);
      set({ user: res.user, pendingEmail: null, isSignUp: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "unknown_error" });
    } finally {
      set({ loading: false });
    }
  },

  google: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const res = await client.googleAuth({ id_token: idToken });
      persist(res.tokens, res.user.id);
      set({ user: res.user, pendingEmail: null, isSignUp: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "unknown_error" });
    } finally {
      set({ loading: false });
    }
  },

  verify: async (body) => {
    set({ loading: true, error: null });
    try {
      const res = await client.verifyEmail(body);
      persist(res.tokens, res.user.id);
      set({ user: res.user, pendingEmail: null, isSignUp: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "unknown_error" });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    clearPersist();
    set({ user: null, pendingEmail: null, isSignUp: false, error: null });
  },

  setError: (error) => set({ error }),
  clearPending: () => set({ pendingEmail: null, isSignUp: false }),
}));
