import { create } from 'zustand';
import { client } from '@/lib/api/client';
import type { Note } from '@/lib/api/mock/data';

interface NotesState {
  notes: Note[];
  current: Note | null;
  loading: boolean;
  error: string | null;
  load: (userId: string, opts?: { q?: string; tag?: string }) => Promise<void>;
  open: (id: string) => Promise<void>;
  create: (userId: string, body: { title: string; content: string; tags?: string[] }) => Promise<Note | null>;
  save: (id: string, body: { title?: string; content?: string; tags?: string[] }) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotes = create<NotesState>((set, get) => ({
  notes: [],
  current: null,
  loading: false,
  error: null,

  load: async (userId, opts) => {
    set({ loading: true, error: null });
    try {
      const notes = await client.listNotes(userId, opts);
      set({ notes, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown', loading: false });
    }
  },

  open: async (id) => {
    const note = await client.getNote(id);
    set({ current: note });
  },

  create: async (userId, body) => {
    try {
      const note = await client.createNote(userId, body);
      set({ notes: [note, ...get().notes] });
      return note;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
      return null;
    }
  },

  save: async (id, body) => {
    try {
      const updated = await client.updateNote(id, body);
      set({
        current: updated,
        notes: get().notes.map((n) => (n.id === id ? updated : n)),
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
    }
  },

  remove: async (id) => {
    await client.deleteNote(id);
    set({
      notes: get().notes.filter((n) => n.id !== id),
      current: null,
    });
  },
}));
