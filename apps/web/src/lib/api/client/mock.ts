import type { ApiClient } from "./types";
import * as api from "../mock/api";

export const mockClient: ApiClient = {
  findUserByEmail: api.findUserByEmail,

  login: (b) => Promise.resolve(api.login(b)),
  register: (b) => Promise.resolve(api.register(b)),
  googleAuth: (b) => Promise.resolve(api.googleAuth(b)),
  verifyEmail: (b) => Promise.resolve(api.verifyEmail(b)),
  updateProfile: (u, b) => Promise.resolve(api.updateProfile(u, b)),
  getMe: (u) => Promise.resolve(api.getMe(u)),
  logout: () => { api.mockLogout(); return Promise.resolve(); },
  refresh: (t) => Promise.resolve(api.mockRefresh(t)),
  getUser: (id) => Promise.resolve(api.getUser(id)),
  joinTeam: (t, u, tok) => Promise.resolve(api.joinTeam(t, u, tok)),
  addExplicitLink: (n, t) => Promise.resolve(api.addExplicitLink(n, t)),

  listNotes: (u, o) => Promise.resolve(api.listNotes(u, o)),
  getNote: (id) => Promise.resolve(api.getNote(id)),
  createNote: (u, b) => Promise.resolve(api.createNote(u, b)),
  updateNote: (id, b) => Promise.resolve(api.updateNote(id, b)),
  deleteNote: (id) => Promise.resolve(api.deleteNote(id)),
  getNoteLinks: (id) => Promise.resolve(api.getNoteLinks(id)),
  getBacklinks: (t) => Promise.resolve(api.getBacklinks(t)),
  shareNoteToTeam: (n, t) => Promise.resolve(api.shareNoteToTeam(n, t)),

  listGoals: (u) => Promise.resolve(api.listGoals(u)),
  getGoal: (id) => Promise.resolve(api.getGoal(id)),
  createGoal: (u, b) => Promise.resolve(api.createGoal(u, b)),
  updateGoal: (id, b) => Promise.resolve(api.updateGoal(id, b)),
  deleteGoal: (id) => Promise.resolve(api.deleteGoal(id)),
  addProgress: (g, a) => Promise.resolve(api.addProgress(g, a)),

  listTasks: (u, o) => Promise.resolve(api.listTasks(u, o)),
  createTask: (u, b) => Promise.resolve(api.createTask(u, b)),
  updateTask: (id, b) => Promise.resolve(api.updateTask(id, b)),
  deleteTask: (id) => Promise.resolve(api.deleteTask(id)),

  listTeams: (u) => Promise.resolve(api.listTeams(u)),
  getTeam: (id) => Promise.resolve(api.getTeam(id)),
  createTeam: (u, b) => Promise.resolve(api.createTeam(u, b)),
  listTeamMembers: (t) => Promise.resolve(api.listTeamMembers(t)),
  inviteMember: (t, b) => Promise.resolve(api.inviteMember(t, b)),

  getGraph: (u, t) => Promise.resolve(api.getGraph(u, t)),

  listNotifications: (u) => Promise.resolve(api.listNotifications(u)),
  markNotificationsRead: (i) => Promise.resolve(api.markNotificationsRead(i)),

  getActivityDates: () => Promise.resolve(api.getActivityDates()),
  computeStreak: () => Promise.resolve(api.computeStreak()),
  getWeekActivity: () => Promise.resolve(api.getWeekActivity()),
  getActivityStats: (u) => Promise.resolve(api.getActivityStats(u)),
};
