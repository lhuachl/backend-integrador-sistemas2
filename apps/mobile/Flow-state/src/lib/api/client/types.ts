import type {
  User,
  InternalUser,
  Team,
  TeamMember,
  Note,
  NoteLink,
  Goal,
  Task,
  GraphData,
  Notification,
} from '../mock/data';

export interface AuthResponse {
  user: User;
  tokens: { access_token: string; refresh_token: string; expires_in: number };
  requires_verification?: boolean;
}

export type LoginBody = { email: string; password: string };
export type RegisterBody = { email: string; password: string; name: string };
export type GoogleBody = { id_token: string };
export type VerifyBody = { email: string; code: string };

export interface NoteCreateBody { title: string; content: string; team_id?: string | null; tags?: string[]; is_public?: boolean }
export interface NoteUpdateBody { title?: string; content?: string; tags?: string[]; is_public?: boolean }
export interface GoalCreateBody { title: string; description?: string; target: number; unit: string; deadline?: string | null }
export interface GoalUpdateBody { title?: string; description?: string; target?: number; unit?: string; deadline?: string | null }
export interface TaskCreateBody { title: string; goal_id?: string | null; due_date?: string | null }
export interface TaskUpdateBody { title?: string; status?: 'todo' | 'in_progress' | 'done'; due_date?: string | null }
export interface TeamCreateBody { name: string; description?: string }
export interface InviteBody { email: string; role?: 'mentor' | 'member' }
export interface ActivityStats { tasksDone: number; tasksTotal: number; goalsCompleted: number; streak: number }

export interface ApiClient {
  findUserByEmail(email: string): InternalUser | null;
  login(body: LoginBody): Promise<AuthResponse>;
  register(body: RegisterBody): Promise<AuthResponse>;
  googleAuth(body: GoogleBody): Promise<AuthResponse>;
  verifyEmail(body: VerifyBody): Promise<AuthResponse>;
  updateProfile(userId: string, body: { name?: string; handle?: string; avatar_url?: string | null }): Promise<User>;
  getMe(userId: string): Promise<User | null>;
  logout(): Promise<void>;
  refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
  getUser(id: string): Promise<User | null>;
  joinTeam(teamId: string, userId: string, token: string): Promise<TeamMember>;
  addExplicitLink(noteId: string, targetTitle: string): Promise<NoteLink | null>;

  listNotes(userId: string, opts?: { teamId?: string; q?: string; tag?: string }): Promise<Note[]>;
  getNote(id: string): Promise<Note | null>;
  createNote(userId: string, body: NoteCreateBody): Promise<Note>;
  updateNote(id: string, body: NoteUpdateBody): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  getNoteLinks(id: string): Promise<NoteLink[]>;
  getBacklinks(title: string): Promise<NoteLink[]>;
  shareNoteToTeam(noteId: string, teamId: string): Promise<Note>;

  listGoals(userId: string): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | null>;
  createGoal(userId: string, body: GoalCreateBody): Promise<Goal>;
  updateGoal(id: string, body: GoalUpdateBody): Promise<Goal>;
  deleteGoal(id: string): Promise<void>;
  addProgress(goalId: string, amount: number): Promise<Goal>;

  listTasks(userId: string, opts?: { goalId?: string; status?: string }): Promise<Task[]>;
  createTask(userId: string, body: TaskCreateBody): Promise<Task>;
  updateTask(id: string, body: TaskUpdateBody): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  listTeams(userId: string): Promise<Team[]>;
  getTeam(id: string): Promise<Team | null>;
  createTeam(userId: string, body: TeamCreateBody): Promise<Team>;
  listTeamMembers(teamId: string): Promise<Array<TeamMember & { name: string; email: string }>>;
  inviteMember(teamId: string, body: InviteBody): Promise<TeamMember>;

  getGraph(userId: string, teamId?: string): Promise<GraphData>;

  listNotifications(userId: string): Promise<Notification[]>;
  markNotificationsRead(ids?: string[]): Promise<void>;

  getActivityDates(): Promise<string[]>;
  computeStreak(): Promise<number>;
  getWeekActivity(): Promise<Array<{ date: string; active: boolean }>>;
  getActivityStats(userId: string): Promise<ActivityStats>;
}
