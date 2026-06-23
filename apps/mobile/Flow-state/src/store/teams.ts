import { create } from 'zustand';
import { client } from '@/lib/api/client';
import type { Team, TeamMember } from '@/lib/api/mock/data';

interface MemberWithName extends TeamMember {
  name: string;
  email: string;
}

interface TeamsState {
  teams: Team[];
  members: Record<string, MemberWithName[]>;
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  loadMembers: (teamId: string) => Promise<void>;
  create: (userId: string, body: { name: string; description?: string }) => Promise<Team | null>;
  invite: (teamId: string, body: { email: string; role?: 'mentor' | 'member' }) => Promise<void>;
}

export const useTeams = create<TeamsState>((set) => ({
  teams: [],
  members: {},
  loading: false,
  error: null,

  load: async (userId) => {
    set({ loading: true });
    try {
      const teams = await client.listTeams(userId);
      set({ teams, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown', loading: false });
    }
  },

  loadMembers: async (teamId) => {
    try {
      const members = await client.listTeamMembers(teamId);
      set((s) => ({ members: { ...s.members, [teamId]: members } }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
    }
  },

  create: async (userId, body) => {
    try {
      const team = await client.createTeam(userId, body);
      set((s) => ({ teams: [...s.teams, team] }));
      return team;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
      return null;
    }
  },

  invite: async (teamId, body) => {
    try {
      await client.inviteMember(teamId, body);
      const members = await client.listTeamMembers(teamId);
      set((s) => ({ members: { ...s.members, [teamId]: members } }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'unknown' });
    }
  },
}));
