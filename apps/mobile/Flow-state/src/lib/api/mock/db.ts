import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { uuid } from '@/utils/uuid';

const SCHEMA = `PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  handle TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TEXT NOT NULL,
  UNIQUE(user_id, team_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  is_public INTEGER NOT NULL DEFAULT 0,
  shared_with TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_links (
  id TEXT PRIMARY KEY,
  source_note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id TEXT REFERENCES notes(id) ON DELETE CASCADE,
  target_title TEXT NOT NULL,
  UNIQUE(source_note_id, target_title)
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  current REAL NOT NULL DEFAULT 0,
  target REAL NOT NULL,
  unit TEXT NOT NULL,
  deadline TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  due_date TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);`;

export interface MockUser {
  id: string;
  email: string;
  name: string;
  handle: string | null;
  avatar_url: string | null;
  role: 'user' | 'mentor' | 'admin';
  password_hash: string | null;
  verified: number;
  created_at: string;
}

let db: SQLiteDatabase | null = null;
let ready = false;

function now() {
  return new Date().toISOString();
}

export function getDb(): SQLiteDatabase {
  if (Platform.OS === 'web') {
    throw new Error('SQLite is not available on web. Use db.web.ts.');
  }
  if (!db) {
    db = openDatabaseSync('flowstate.db');
  }
  return db;
}

export function resetDb() {
  if (Platform.OS === 'web') return;
  const d = getDb();
  d.execSync('DROP TABLE IF EXISTS notifications;');
  d.execSync('DROP TABLE IF EXISTS tasks;');
  d.execSync('DROP TABLE IF EXISTS goals;');
  d.execSync('DROP TABLE IF EXISTS note_links;');
  d.execSync('DROP TABLE IF EXISTS notes;');
  d.execSync('DROP TABLE IF EXISTS team_members;');
  d.execSync('DROP TABLE IF EXISTS teams;');
  d.execSync('DROP TABLE IF EXISTS users;');
  ready = false;
  initDb();
}

export function initDb() {
  if (Platform.OS === 'web') return;
  if (ready) return;
  const d = getDb();
  d.execSync(SCHEMA);
  seed();
  ready = true;
}

function seed() {
  const d = getDb();
  const existing = d.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM users;');
  if (existing && existing.count > 0) return;

  const sofiaId = uuid();
  const demoTeamId = uuid();
  const note1Id = uuid();
  const note2Id = uuid();
  const goal1Id = uuid();

  d.runSync(
    `INSERT INTO users (id, email, name, handle, role, password_hash, verified, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [sofiaId, 'sofia@flowstate.app', 'Sofia Chen', 'sofia', 'user', 'mockhash', 1, now()]
  );

  d.runSync(
    `INSERT INTO teams (id, name, slug, description, owner_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [demoTeamId, 'Equipo Demo', 'equipo-demo', 'Espacio compartido para probar Flow-state.', sofiaId, now()]
  );

  d.runSync(
    `INSERT INTO team_members (id, user_id, team_id, role, joined_at)
     VALUES (?, ?, ?, ?, ?);`,
    [uuid(), sofiaId, demoTeamId, 'owner', now()]
  );

  d.runSync(
    `INSERT INTO notes (id, title, content, author_id, team_id, tags, is_public, shared_with, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      note1Id,
      'Bienvenida a Flow-state',
      'Esta es tu primera nota. Puedes editarla, enlazarla con [[otras notas]] y compartirla con tu equipo.',
      sofiaId,
      null,
      JSON.stringify(['onboarding']),
      0,
      JSON.stringify([]),
      now(),
      now(),
    ]
  );

  d.runSync(
    `INSERT INTO notes (id, title, content, author_id, team_id, tags, is_public, shared_with, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      note2Id,
      'otras notas',
      'Las wikilinks te permiten navegar entre ideas. Cada [[título]] es una conexión.',
      sofiaId,
      null,
      JSON.stringify(['knowledge']),
      0,
      JSON.stringify([]),
      now(),
      now(),
    ]
  );

  d.runSync(
    `INSERT INTO note_links (id, source_note_id, target_note_id, target_title)
     VALUES (?, ?, ?, ?);`,
    [uuid(), note1Id, note2Id, 'otras notas']
  );

  d.runSync(
    `INSERT INTO goals (id, title, description, user_id, current, target, unit, deadline, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [goal1Id, 'Leer 10 papers', 'Meta de aprendizaje semanal', sofiaId, 3, 10, 'papers', null, now()]
  );

  d.runSync(
    `INSERT INTO tasks (id, title, status, user_id, goal_id, due_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [uuid(), 'Resumir paper #4', 'todo', sofiaId, goal1Id, null, now()]
  );

  d.runSync(
    `INSERT INTO notifications (id, user_id, type, title, body, read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [uuid(), sofiaId, 'system', 'Bienvenida', 'Flow-state está listo para usar.', 0, now()]
  );
}

export function findUserByEmail(email: string): MockUser | null {
  if (Platform.OS === 'web') return null;
  initDb();
  return getDb().getFirstSync<MockUser>('SELECT * FROM users WHERE email = ?;', [email]) ?? null;
}

export function createUser(data: {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  verified?: number;
}): MockUser {
  if (Platform.OS === 'web') throw new Error('Cannot create user on web mock.');
  initDb();
  const user: MockUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    handle: null,
    avatar_url: null,
    role: 'user',
    password_hash: data.password_hash,
    verified: data.verified ?? 0,
    created_at: now(),
  };
  getDb().runSync(
    `INSERT INTO users (id, email, name, handle, avatar_url, role, password_hash, verified, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [user.id, user.email, user.name, user.handle, user.avatar_url, user.role, user.password_hash, user.verified, user.created_at]
  );
  return user;
}

export function verifyUser(id: string) {
  if (Platform.OS === 'web') return;
  initDb();
  getDb().runSync('UPDATE users SET verified = 1 WHERE id = ?;', [id]);
}
