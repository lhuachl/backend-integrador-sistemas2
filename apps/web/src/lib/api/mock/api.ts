import { db, genId, now, todayStr, daysAgo, type InternalUser, type User, type Team, type TeamMember, type Note, type NoteLink, type Goal, type Task, type GraphData, type Notification } from "./data";

type LoginBody = { email: string; password: string };
type RegisterBody = { email: string; password: string; name: string };
type GoogleBody = { id_token: string };
type VerifyBody = { email: string; code: string };

export interface AuthResponse {
  user: User;
  tokens: { access_token: string; refresh_token: string; expires_in: number };
  requires_verification?: boolean;
}

function tokens() {
  return { access_token: "mock-access-" + genId(), refresh_token: "mock-refresh-" + genId(), expires_in: 3600 };
}

function publicUser(u: InternalUser): User {
  const { password_hash, verified, ...pub } = u;
  return pub;
}

export function findUserByEmail(email: string): InternalUser | null {
  return db.users.find((u) => u.email === email) ?? null;
}

export function login(body: LoginBody): AuthResponse {
  const user = findUserByEmail(body.email);
  if (!user) throw new Error("invalid_credentials");
  if (!user.verified) {
    return { user: publicUser(user), tokens: tokens(), requires_verification: true };
  }
  return { user: publicUser(user), tokens: tokens() };
}

export function register(body: RegisterBody): AuthResponse {
  const existing = findUserByEmail(body.email);
  if (existing) throw new Error("email_already_registered");
  const user: InternalUser = {
    id: "user-" + genId(),
    email: body.email,
    name: body.name,
    handle: null,
    avatar_url: null,
    role: "user",
    password_hash: body.password,
    verified: false,
    created_at: now(),
  };
  db.users.push(user);
  return { user: publicUser(user), tokens: tokens(), requires_verification: true };
}

export function googleAuth(body: GoogleBody): AuthResponse {
  const email = body.id_token.slice(0, 8) + "@google.mock";
  let user = findUserByEmail(email);
  if (!user) {
    user = { id: "google-" + genId(), email, name: "Google User", handle: null, avatar_url: null, role: "user", password_hash: "google", verified: true, created_at: now() };
    db.users.push(user);
  }
  return { user: publicUser(user), tokens: tokens() };
}

export function verifyEmail(body: VerifyBody): AuthResponse {
  const user = findUserByEmail(body.email);
  if (!user) throw new Error("user_not_found");
  if (body.code.length !== 6) throw new Error("invalid_code");
  user.verified = true;
  return { user: publicUser(user), tokens: tokens() };
}

export function updateProfile(userId: string, body: { name?: string; handle?: string; avatar_url?: string | null }): User {
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error("user_not_found");
  if (body.name !== undefined) user.name = body.name;
  if (body.handle !== undefined) user.handle = body.handle;
  if (body.avatar_url !== undefined) user.avatar_url = body.avatar_url;
  return publicUser(user);
}

export function getMe(userId: string): User | null {
  const user = db.users.find((u) => u.id === userId);
  return user ? publicUser(user) : null;
}

export function mockLogout(): void {}

export function mockRefresh(refreshToken: string): { access_token: string; refresh_token: string; expires_in: number } {
  return tokens();
}

export function getUser(id: string): User | null {
  const user = db.users.find((u) => u.id === id);
  return user ? publicUser(user) : null;
}

export function joinTeam(teamId: string, userId: string, _token: string): TeamMember {
  const team = db.teams.find((t) => t.id === teamId);
  if (!team) throw new Error("team_not_found");
  const exists = db.teamMembers.find((m) => m.team_id === teamId && m.user_id === userId);
  if (exists) return exists;
  const member: TeamMember = {
    id: "tm-" + genId(),
    user_id: userId,
    team_id: teamId,
    role: "member",
    joined_at: now(),
  };
  db.teamMembers.push(member);
  return member;
}

export function addExplicitLink(noteId: string, targetTitle: string): NoteLink | null {
  const source = db.notes.find((n) => n.id === noteId);
  if (!source) throw new Error("note_not_found");
  const target = db.notes.find((n) => n.title.toLowerCase() === targetTitle.toLowerCase());
  const exists = db.noteLinks.find((l) => l.source_note_id === noteId && l.target_title.toLowerCase() === targetTitle.toLowerCase());
  if (exists) return exists;
  const link: NoteLink = {
    id: "nl-" + genId(),
    source_note_id: noteId,
    target_note_id: target?.id ?? null,
    target_title: targetTitle,
  };
  db.noteLinks.push(link);
  return link;
}

export function listNotes(userId: string, opts?: { teamId?: string; q?: string; tag?: string }): Note[] {
  const userTeamIds = db.teamMembers
    .filter((m) => m.user_id === userId)
    .map((m) => m.team_id);
  let notes = db.notes.filter(
    (n) =>
      n.author_id === userId ||
      n.team_id === opts?.teamId ||
      n.is_public ||
      n.shared_with.some((tid) => userTeamIds.includes(tid)),
  );
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    notes = notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }
  if (opts?.tag) notes = notes.filter((n) => n.tags.includes(opts.tag!));
  return notes.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getNote(id: string): Note | null {
  return db.notes.find((n) => n.id === id) ?? null;
}

export function createNote(userId: string, body: { title: string; content: string; team_id?: string | null; tags?: string[]; is_public?: boolean }): Note {
  const note: Note = {
    id: "note-" + genId(),
    title: body.title,
    content: body.content,
    author_id: userId,
    team_id: body.team_id ?? null,
    tags: body.tags ?? [],
    is_public: body.is_public ?? false,
    shared_with: [],
    created_at: now(),
    updated_at: now(),
  };
  db.notes.push(note);
  syncLinks(note.id, note.content);
  return note;
}

export function updateNote(id: string, body: { title?: string; content?: string; tags?: string[]; is_public?: boolean }): Note {
  const note = db.notes.find((n) => n.id === id);
  if (!note) throw new Error("note_not_found");
  if (body.title !== undefined) note.title = body.title;
  if (body.content !== undefined) note.content = body.content;
  if (body.tags !== undefined) note.tags = body.tags;
  if (body.is_public !== undefined) note.is_public = body.is_public;
  note.updated_at = now();
  syncLinks(note.id, note.content);
  return note;
}

export function deleteNote(id: string): void {
  db.notes = db.notes.filter((n) => n.id !== id);
  db.noteLinks = db.noteLinks.filter((l) => l.source_note_id !== id && l.target_note_id !== id);
}

export function getNoteLinks(id: string): NoteLink[] {
  return db.noteLinks.filter((l) => l.source_note_id === id);
}

export function getBacklinks(title: string): NoteLink[] {
  return db.noteLinks.filter((l) => l.target_title.toLowerCase() === title.toLowerCase());
}

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

function syncLinks(noteId: string, content: string) {
  db.noteLinks = db.noteLinks.filter((l) => l.source_note_id !== noteId);
  const titles = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = WIKILINK_RE.exec(content)) !== null) {
    titles.add(m[1].trim());
  }
  for (const title of titles) {
    const target = db.notes.find((n) => n.title.toLowerCase() === title.toLowerCase());
    db.noteLinks.push({
      id: "nl-" + genId(),
      source_note_id: noteId,
      target_note_id: target?.id ?? null,
      target_title: title,
    });
  }
}

export function listGoals(userId: string): Goal[] {
  return db.goals.filter((g) => g.user_id === userId);
}

export function getGoal(id: string): Goal | null {
  return db.goals.find((g) => g.id === id) ?? null;
}

export function createGoal(userId: string, body: { title: string; description?: string; target: number; unit: string; deadline?: string | null }): Goal {
  const goal: Goal = {
    id: "goal-" + genId(),
    title: body.title,
    description: body.description ?? null,
    user_id: userId,
    team_id: null,
    current: 0,
    target: body.target,
    unit: body.unit,
    deadline: body.deadline ?? null,
    created_at: now(),
  };
  db.goals.push(goal);
  return goal;
}

export function updateGoal(id: string, body: { title?: string; description?: string; target?: number; unit?: string; deadline?: string | null }): Goal {
  const goal = db.goals.find((g) => g.id === id);
  if (!goal) throw new Error("goal_not_found");
  if (body.title !== undefined) goal.title = body.title;
  if (body.description !== undefined) goal.description = body.description;
  if (body.target !== undefined) goal.target = body.target;
  if (body.unit !== undefined) goal.unit = body.unit;
  if (body.deadline !== undefined) goal.deadline = body.deadline;
  return goal;
}

export function deleteGoal(id: string): void {
  db.goals = db.goals.filter((g) => g.id !== id);
  db.tasks = db.tasks.filter((t) => t.goal_id !== id);
}

export function addProgress(goalId: string, amount: number): Goal {
  const goal = db.goals.find((g) => g.id === goalId);
  if (!goal) throw new Error("goal_not_found");
  goal.current = Math.min(goal.current + amount, goal.target);
  recordActivity();
  return goal;
}

export function listTasks(userId: string, opts?: { goalId?: string; status?: string }): Task[] {
  let tasks = db.tasks.filter((t) => t.user_id === userId);
  if (opts?.goalId) tasks = tasks.filter((t) => t.goal_id === opts.goalId);
  if (opts?.status) tasks = tasks.filter((t) => t.status === opts.status);
  return tasks;
}

export function createTask(userId: string, body: { title: string; goal_id?: string | null; due_date?: string | null }): Task {
  const task: Task = {
    id: "task-" + genId(),
    title: body.title,
    status: "todo",
    user_id: userId,
    goal_id: body.goal_id ?? null,
    due_date: body.due_date ?? null,
    created_at: now(),
  };
  db.tasks.push(task);
  return task;
}

export function updateTask(id: string, body: { title?: string; status?: "todo" | "in_progress" | "done"; due_date?: string | null }): Task {
  const task = db.tasks.find((t) => t.id === id);
  if (!task) throw new Error("task_not_found");
  if (body.title !== undefined) task.title = body.title;
  if (body.status !== undefined) {
    const wasDone = task.status === "done";
    task.status = body.status;
    if (body.status === "done" && !wasDone) {
      recordActivity();
      if (task.goal_id) addProgress(task.goal_id, 1);
    }
  }
  if (body.due_date !== undefined) task.due_date = body.due_date;
  return task;
}

export function deleteTask(id: string): void {
  db.tasks = db.tasks.filter((t) => t.id !== id);
}

export function listTeams(userId: string): Team[] {
  const memberOf = db.teamMembers.filter((m) => m.user_id === userId).map((m) => m.team_id);
  return db.teams.filter((t) => memberOf.includes(t.id));
}

export function getTeam(id: string): Team | null {
  return db.teams.find((t) => t.id === id) ?? null;
}

export function listTeamMembers(teamId: string): Array<TeamMember & { name: string; email: string }> {
  return db.teamMembers
    .filter((m) => m.team_id === teamId)
    .map((m) => {
      const user = db.users.find((u) => u.id === m.user_id);
      return { ...m, name: user?.name ?? "Unknown", email: user?.email ?? "" };
    });
}

export function createTeam(userId: string, body: { name: string; description?: string }): Team {
  const slug = body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const team: Team = {
    id: "team-" + genId(),
    name: body.name,
    slug,
    description: body.description ?? null,
    owner_id: userId,
    created_at: now(),
  };
  db.teams.push(team);
  db.teamMembers.push({
    id: "tm-" + genId(),
    user_id: userId,
    team_id: team.id,
    role: "owner",
    joined_at: now(),
  });
  return team;
}

export function inviteMember(teamId: string, body: { email: string; role?: "mentor" | "member" }): TeamMember {
  let user = db.users.find((u) => u.email === body.email);
  if (!user) {
    user = { id: "user-" + genId(), email: body.email, name: body.email.split("@")[0], handle: null, avatar_url: null, role: "user", password_hash: "mockhash", verified: true, created_at: now() };
    db.users.push(user);
  }
  const exists = db.teamMembers.find((m) => m.team_id === teamId && m.user_id === user.id);
  if (exists) throw new Error("already_member");
  const member: TeamMember = {
    id: "tm-" + genId(),
    user_id: user.id,
    team_id: teamId,
    role: body.role ?? "member",
    joined_at: now(),
  };
  db.teamMembers.push(member);
  return member;
}

export function shareNoteToTeam(noteId: string, teamId: string): Note {
  const note = db.notes.find((n) => n.id === noteId);
  if (!note) throw new Error("note_not_found");
  if (!note.shared_with.includes(teamId)) {
    note.shared_with.push(teamId);
  }
  return note;
}

export function getGraph(userId: string, teamId?: string): GraphData {
  const notes = listNotes(userId, { teamId });
  const noteIds = new Set(notes.map((n) => n.id));
  const nodes: GraphData["nodes"] = notes.map((n) => ({ id: n.id, label: n.title, type: "note" }));
  const goals = db.goals
    .filter((g) => g.user_id === userId)
    .map((g) => ({ id: g.id, label: g.title, type: "goal" as const }));
  nodes.push(...goals);
  const edges = db.noteLinks
    .filter((l) => noteIds.has(l.source_note_id) && (!l.target_note_id || noteIds.has(l.target_note_id)))
    .map((l) => ({ source: l.source_note_id, target: l.target_note_id ?? l.target_title, label: "links" }));
  return { nodes, edges };
}

export function listNotifications(userId: string): Notification[] {
  return db.notifications;
}

export function markNotificationsRead(ids?: string[]): void {
  for (const n of db.notifications) {
    if (!ids || ids.includes(n.id)) n.read = true;
  }
}

function recordActivity() {
  const today = todayStr();
  if (!db.activityDates.includes(today)) {
    db.activityDates.push(today);
  }
}

export function getActivityDates(): string[] {
  return db.activityDates;
}

export function computeStreak(): number {
  const dates = [...new Set(db.activityDates)].sort().reverse();
  if (dates.length === 0 || dates[0] !== todayStr()) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function getWeekActivity(): Array<{ date: string; active: boolean }> {
  const activeSet = new Set(db.activityDates);
  const week: Array<{ date: string; active: boolean }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    week.push({ date: d, active: activeSet.has(d) });
  }
  return week;
}

export function getActivityStats(userId: string) {
  const tasks = db.tasks.filter((t) => t.user_id === userId);
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const goals = db.goals.filter((g) => g.user_id === userId);
  const completedGoals = goals.filter((g) => g.current >= g.target).length;
  return {
    tasksDone: done,
    tasksTotal: total,
    goalsCompleted: completedGoals,
    streak: computeStreak(),
  };
}
