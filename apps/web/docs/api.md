# Flow-state API Contract

## Overview

Base URL: `http://localhost:3000/api`
Source of truth: `docs/api.yaml` (originally from mobile app)

Auth: Bearer token in `Authorization` header. Tokens obtained via `/auth/login`, `/auth/register`, `/auth/google`.
Refresh: POST `/auth/refresh` with `{ refresh_token }` to get new tokens.

---

## Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/me` | Current session user |
| POST | `/auth/login` | Email + password login |
| POST | `/auth/register` | Email + password registration |
| POST | `/auth/google` | Google one-tap credential exchange |
| POST | `/auth/verify-email` | Verify email with 6-digit code |
| POST | `/auth/logout` | Revoke tokens |
| POST | `/auth/refresh` | Refresh access token |

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/{id}` | User profile |
| PATCH | `/users/me/profile` | Update own profile |

### Teams

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teams` | List user's teams |
| POST | `/teams` | Create team |
| GET | `/teams/{id}` | Team detail |
| GET | `/teams/{id}/members` | Members list |
| POST | `/teams/{id}/members` | Invite member by email |
| POST | `/teams/{id}/join` | Join team with token |

### Notes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notes` | List notes (filters: `team_id`, `q`, `tag`) |
| POST | `/notes` | Create note |
| GET | `/notes/{id}` | Note detail |
| PATCH | `/notes/{id}` | Update note |
| DELETE | `/notes/{id}` | Delete note |
| GET | `/notes/{id}/links` | Note links |
| POST | `/notes/{id}/links` | Add explicit link |
| POST | `/notes/{id}/share` | Share note to team |

### Goals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/goals` | List goals |
| POST | `/goals` | Create goal |
| GET | `/goals/{id}` | Goal detail |
| PATCH | `/goals/{id}` | Update goal |
| DELETE | `/goals/{id}` | Delete goal |
| POST | `/goals/{id}/progress` | Add progress amount |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List tasks (filters: `goal_id`, `due_date`, `status`) |
| POST | `/tasks` | Create task |
| PATCH | `/tasks/{id}` | Update task |
| DELETE | `/tasks/{id}` | Delete task |

### Graph

| Method | Path | Description |
|--------|------|-------------|
| GET | `/graph` | Graph nodes and edges (filter: `team_id`) |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List notifications |
| PATCH | `/notifications` | Mark as read (body: `{ ids?: string[] }`) |

---

## Key Schemas

### User
`{ id, email, name, handle?, avatar_url?, role: 'user'|'mentor'|'admin', created_at }`

### TeamMember
`{ id, user_id, team_id, role: 'owner'|'mentor'|'member', joined_at }`

### Note
`{ id, title, content, author_id, team_id?, tags: string[], is_public: boolean, shared_with: string[], created_at, updated_at }`

### Goal
`{ id, title, description?, user_id, team_id?, current: number, target: number, unit: string, deadline?, created_at }`

### Task
`{ id, title, status: 'todo'|'in_progress'|'done', user_id, goal_id?, due_date?, created_at }`

### AuthResponse
`{ user: User, tokens: { access_token, refresh_token, expires_in }, requires_verification?: boolean }`

---

## Constraints

- Mock-first: all endpoints return mock data from in-memory store.
- Switch to real backend: set `NEXT_PUBLIC_USE_REAL_API=true`.
- Tokens persist in localStorage (web) vs expo-secure-store (mobile).
- Wikilinks: `[[title]]` in note content auto-creates NoteLinks.
