import { uuid } from "@/lib/utils";

export interface User {
  id: string;
  email: string;
  name: string;
  handle: string | null;
  avatar_url: string | null;
  role: "user" | "mentor" | "admin";
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: "owner" | "mentor" | "member";
  joined_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  author_id: string;
  team_id: string | null;
  tags: string[];
  is_public: boolean;
  shared_with: string[];
  created_at: string;
  updated_at: string;
}

export interface NoteLink {
  id: string;
  source_note_id: string;
  target_note_id: string | null;
  target_title: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  team_id: string | null;
  current: number;
  target: number;
  unit: string;
  deadline: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  user_id: string;
  goal_id: string | null;
  due_date: string | null;
  created_at: string;
}

export interface GraphData {
  nodes: Array<{ id: string; label: string; type: "note" | "goal" | "user" | "tag" }>;
  edges: Array<{ source: string; target: string; label?: string }>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface InternalUser extends User {
  password_hash: string;
  verified: boolean;
}

function now() {
  return new Date().toISOString();
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const sofiaId = "user-sofia";
const demoTeamId = "team-demo";
const note1Id = "note-welcome";
const note2Id = "note-wikilinks";
const note3Id = "note-graph-theory";
const goal1Id = "goal-papers";
const goal2Id = "goal-writing";
const taskId = "task-paper4";

const db: {
  users: InternalUser[];
  teams: Team[];
  teamMembers: TeamMember[];
  notes: Note[];
  noteLinks: NoteLink[];
  goals: Goal[];
  tasks: Task[];
  notifications: Notification[];
  activityDates: string[];
} = {
  users: [
    { id: sofiaId, email: "sofia@flowstate.app", name: "Sofia Chen", handle: "sofia", avatar_url: null, role: "user", password_hash: "mockhash", verified: true, created_at: "2026-06-01T10:00:00Z" },
    { id: "user-marcus", email: "marcus@flowstate.app", name: "Marcus Vega", handle: "marcus", avatar_url: null, role: "mentor", password_hash: "mockhash", verified: true, created_at: "2026-06-02T10:00:00Z" },
  ],
  teams: [
    { id: demoTeamId, name: "Equipo Demo", slug: "equipo-demo", description: "Espacio compartido para probar Flow-state.", owner_id: sofiaId, created_at: "2026-06-01T10:00:00Z" },
  ],
  teamMembers: [
    { id: "tm-1", user_id: sofiaId, team_id: demoTeamId, role: "owner", joined_at: "2026-06-01T10:00:00Z" },
    { id: "tm-2", user_id: "user-marcus", team_id: demoTeamId, role: "mentor", joined_at: "2026-06-02T10:00:00Z" },
  ],
  notes: [
    {
      id: note1Id,
      title: "Bienvenida a Flow-state",
      content: "Esta es tu primera nota. Puedes editarla, enlazarla con [[otras notas]] y compartirla con tu equipo.\n\n## Tips\n- Usa [[títulos entre corchetes]] para crear conexiones\n- Los tags organizan tu grafo\n- Comparte notas con tu equipo",
      author_id: sofiaId,
      team_id: null,
      tags: ["onboarding", "tips"],
      is_public: false,
      shared_with: [],
      created_at: "2026-06-01T10:00:00Z",
      updated_at: "2026-06-01T10:00:00Z",
    },
    {
      id: note2Id,
      title: "otras notas",
      content: "Las wikilinks te permiten navegar entre ideas. Cada [[título]] es una conexión en tu [[grafo de conocimiento]].\n\nVolver a [[Bienvenida a Flow-state]]",
      author_id: sofiaId,
      team_id: null,
      tags: ["knowledge", "wikilinks"],
      is_public: false,
      shared_with: [],
      created_at: "2026-06-01T11:00:00Z",
      updated_at: "2026-06-01T11:00:00Z",
    },
    {
      id: note3Id,
      title: "grafo de conocimiento",
      content: "Un grafo conecta tus notas por relaciones, no por carpetas. Cada conexión es una idea que se enriquece.\n\nRelacionado: [[otras notas]], [[Bienvenida a Flow-state]]",
      author_id: sofiaId,
      team_id: demoTeamId,
      tags: ["knowledge", "graph"],
      is_public: false,
      shared_with: [demoTeamId],
      created_at: "2026-06-01T12:00:00Z",
      updated_at: "2026-06-01T12:00:00Z",
    },
  ],
  noteLinks: [
    { id: "nl-1", source_note_id: note1Id, target_note_id: note2Id, target_title: "otras notas" },
    { id: "nl-2", source_note_id: note2Id, target_note_id: note3Id, target_title: "grafo de conocimiento" },
    { id: "nl-3", source_note_id: note2Id, target_note_id: note1Id, target_title: "Bienvenida a Flow-state" },
    { id: "nl-4", source_note_id: note3Id, target_note_id: note2Id, target_title: "otras notas" },
    { id: "nl-5", source_note_id: note3Id, target_note_id: note1Id, target_title: "Bienvenida a Flow-state" },
  ],
  goals: [
    { id: goal1Id, title: "Leer 10 papers", description: "Meta de aprendizaje semanal", user_id: sofiaId, team_id: null, current: 3, target: 10, unit: "papers", deadline: null, created_at: "2026-06-01T10:00:00Z" },
    { id: goal2Id, title: "Escribir 5 notas", description: "Documentar lo aprendido", user_id: sofiaId, team_id: null, current: 3, target: 5, unit: "notas", deadline: null, created_at: "2026-06-01T10:00:00Z" },
  ],
  tasks: [
    { id: taskId, title: "Resumir paper #4", status: "todo", user_id: sofiaId, goal_id: goal1Id, due_date: null, created_at: "2026-06-01T10:00:00Z" },
    { id: "task-2", title: "Escribir nota sobre grafos", status: "in_progress", user_id: sofiaId, goal_id: goal2Id, due_date: null, created_at: "2026-06-01T11:00:00Z" },
    { id: "task-3", title: "Revisar paper #1", status: "done", user_id: sofiaId, goal_id: goal1Id, due_date: null, created_at: "2026-05-30T10:00:00Z" },
  ],
  notifications: [
    { id: "ntf-1", type: "system", title: "Bienvenida", body: "Flow-state está listo para usar.", read: false, created_at: "2026-06-01T10:00:00Z" },
  ],
  activityDates: [
    daysAgo(5), daysAgo(4), daysAgo(3), daysAgo(2), daysAgo(1), todayStr(),
  ],
};

export function seedDone() {
  return db.users.length > 0;
}

export { db };

export function genId() {
  return uuid();
}

export { now };
