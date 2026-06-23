# Apéndice B — Diccionario de entidades

## B.1 `users`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | TEXT PK | UUID v4 | Identificador único. |
| `email` | TEXT | UNIQUE, NOT NULL | Email de contacto y login. |
| `name` | TEXT | NOT NULL | Nombre visible. |
| `handle` | TEXT | UNIQUE, nullable | Apodo `@handle`. |
| `avatar_url` | TEXT | nullable | URL del avatar. |
| `role` | TEXT | NOT NULL, CHECK | `user`, `mentor`, `admin`. |
| `password_hash` | TEXT | nullable | bcrypt cost 12; null si sólo OAuth. |
| `verified` | INTEGER | NOT NULL, default 0 | 0/1. |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC. |

## B.2 `teams`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | TEXT PK | UUID v4 | Identificador único. |
| `name` | TEXT | NOT NULL | Nombre del equipo. |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly: `equipo-name`. |
| `description` | TEXT | nullable | Descripción corta. |
| `owner_id` | TEXT FK→users | NOT NULL | Creador y owner permanente. |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC. |

## B.3 `team_members`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | TEXT PK | UUID v4 | Identificador único. |
| `user_id` | TEXT FK→users | NOT NULL, ON DELETE CASCADE | Miembro. |
| `team_id` | TEXT FK→teams | NOT NULL, ON DELETE CASCADE | Equipo. |
| `role` | TEXT | NOT NULL, CHECK | `owner`, `mentor`, `member`. |
| `joined_at` | TEXT | NOT NULL | ISO 8601 UTC. |
| | | UNIQUE(user_id, team_id) | Una fila por par. |

## B.4 `notes`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | TEXT PK | UUID v4 | Identificador único. |
| `title` | TEXT | NOT NULL, ≤ 200 | Título de la nota. |
| `content` | TEXT | NOT NULL, default '' | Markdown. |
| `author_id` | TEXT FK→users | NOT NULL, ON DELETE CASCADE | Autor. |
| `team_id` | TEXT FK→teams | nullable, ON DELETE SET NULL | Equipo si compartida. |
| `tags` | TEXT | NOT NULL, default '[]' | JSON array de strings. |
| `is_public` | INTEGER | NOT NULL, default 0 | 0/1. |
| `shared_with` | TEXT | NOT NULL, default '[]' | JSON array de user IDs. |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC. |
| `updated_at` | TEXT | NOT NULL | ISO 8601 UTC. |

## B.5 `note_links`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | TEXT PK | UUID v4 | Identificador único. |
| `source_note_id` | TEXT FK→notes | NOT NULL, ON DELETE CASCADE | Nota origen. |
| `target_note_id` | TEXT FK→notes | nullable, ON DELETE CASCADE | Nota destino si existe. |
| `target_title` | TEXT | NOT NULL | Título destino (resolución lazy). |
| | | UNIQUE(source_note_id, target_title) | Sin duplicados por par+título. |

## B.6 `goals`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | TEXT PK | UUID v4 | Identificador único. |
| `title` | TEXT | NOT NULL | Título de la meta. |
| `description` | TEXT | nullable | Detalle. |
| `user_id` | TEXT FK→users | NOT NULL, ON DELETE CASCADE | Dueño. |
| `team_id` | TEXT FK→teams | nullable, ON DELETE SET NULL | Equipo si compartida. |
| `current` | REAL | NOT NULL, default 0 | Progreso actual. |
| `target` | REAL | NOT NULL | Meta a alcanzar. |
| `unit` | TEXT | NOT NULL | Unidad: páginas, km, $, etc. |
| `deadline` | TEXT | nullable | Fecha ISO 8601. |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC. |
| | | CHECK(current ≤ target) | Sentido del progreso. |

## B.7 `tasks`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | TEXT PK | UUID v4 | Identificador único. |
| `title` | TEXT | NOT NULL | Título de la tarea. |
| `status` | TEXT | NOT NULL, default 'todo' | `todo`, `in_progress`, `done`. |
| `user_id` | TEXT FK→users | NOT NULL, ON DELETE CASCADE | Responsable. |
| `goal_id` | TEXT FK→goals | nullable, ON DELETE SET NULL | Meta asociada. |
| `due_date` | TEXT | nullable | Fecha ISO 8601. |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC. |

## B.8 `notifications`

| Atributo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | TEXT PK | UUID v4 | Identificador único. |
| `user_id` | TEXT FK→users | NOT NULL, ON DELETE CASCADE | Destinatario. |
| `type` | TEXT | NOT NULL, CHECK | `invitation`, `mention`, `task`, `reminder`. |
| `title` | TEXT | NOT NULL | Título corto. |
| `body` | TEXT | NOT NULL | Texto. |
| `read` | INTEGER | NOT NULL, default 0 | 0/1. |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC. |

## B.9 Diagrama relacional textual

```
users 1───∞ notes (author_id)
users 1───∞ goals  (user_id)
users 1───∞ tasks  (user_id)
users 1───∞ notifications (user_id)
users 1───∞ team_members (user_id)

teams 1───∞ team_members (team_id)
teams 1───∞ notes        (team_id, optional)
teams 1───∞ goals        (team_id, optional)

goals 1───∞ tasks        (goal_id, optional)

notes 1───∞ note_links   (source_note_id)
notes 1───∞ note_links   (target_note_id, optional)

(users 1───1 teams.owner_id) [cada team tiene exactamente un owner]
```

## B.10 Cardinalidades clave

- `users : notes` = 1:N (un usuario crea muchas notas).
- `teams : notes` = 1:N opcional (notas personales con `team_id = NULL`).
- `notes : note_links` = N:M a través de `note_links` (un grafo).
- `goals : tasks` = 1:N opcional (tareas pueden no tener meta).
- `users : teams` = N:M a través de `team_members` (con rol).