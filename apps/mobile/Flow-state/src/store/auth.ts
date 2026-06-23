import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { client } from '@/lib/api/client';
import type { User, LoginBody, RegisterBody, VerifyBody } from '@/lib/api/client';

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

const TOKEN_KEY = 'flowstate_tokens';

async function persist(tokens: { access_token: string; refresh_token: string; expires_in: number }) {
  try { await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens)); } catch {}
}

async function persistWithUser(tokens: { access_token: string; refresh_token: string; expires_in: number }, userId: string) {
  try { await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify({ ...tokens, user_id: userId })); } catch {}
}

async function clearPersist() {
  try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  pendingEmail: null,
  isSignUp: false,
  initialized: false,

  init: async () => {
    set({ loading: true });
    try {
      const raw = await SecureStore.getItemAsync(TOKEN_KEY);
      if (raw) {
        try {
          const tokens = JSON.parse(raw);
          const user = await client.getMe(tokens.user_id ?? '');
          if (user) set({ user });
        } catch {}
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
      await persistWithUser(res.tokens, res.user.id);
      set({ user: res.user, pendingEmail: null, isSignUp: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown_error' });
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
      await persistWithUser(res.tokens, res.user.id);
      set({ user: res.user, pendingEmail: null, isSignUp: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown_error' });
    } finally {
      set({ loading: false });
    }
  },

  google: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const res = await client.googleAuth({ id_token: idToken });
      await persistWithUser(res.tokens, res.user.id);
      set({ user: res.user, pendingEmail: null, isSignUp: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown_error' });
    } finally {
      set({ loading: false });
    }
  },

  verify: async (body) => {
    set({ loading: true, error: null });
    try {
      const res = await client.verifyEmail(body);
      await persistWithUser(res.tokens, res.user.id);
      set({ user: res.user, pendingEmail: null, isSignUp: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown_error' });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await clearPersist();
    set({ user: null, pendingEmail: null, isSignUp: false, error: null });
  },

  setError: (error) => set({ error }),
  clearPending: () => set({ pendingEmail: null, isSignUp: false }),
}));
