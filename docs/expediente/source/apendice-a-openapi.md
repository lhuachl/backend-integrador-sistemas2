# Apéndice A — Resumen del contrato OpenAPI

Este apéndice resume el contrato OpenAPI 3.1 que define la API pública
de FlowState. El archivo completo está versionado en
`apps/web/docs/api.yaml` (847 líneas, 30+ endpoints, 20+ schemas).

## A.1 Información general

```yaml
openapi: 3.1.0
info:
  title: Flow-state API
  version: 0.1.0
  description: Mock-first API contract for the Flow-state mobile app.
servers:
  - url: http://localhost:3000/api
    description: Mock local server
  - url: https://api.flowstate.app/api/v1
    description: Producción
```

## A.2 Endpoints por recurso

### A.2.1 Autenticación (`/auth`)

| Método | Path | Resumen | Auth |
|---|---|---|---|
| GET | `/auth/me` | Usuario actual. | ✅ |
| POST | `/auth/login` | Login email + password. | — |
| POST | `/auth/register` | Registro email + password. | — |
| POST | `/auth/google` | Google OAuth. | — |
| POST | `/auth/verify-email` | Verificación por código. | — |
| POST | `/auth/logout` | Cierra sesión. | ✅ |
| POST | `/auth/refresh` | Renueva tokens. | — |

### A.2.2 Usuarios (`/users`)

| Método | Path | Resumen | Auth |
|---|---|---|---|
| GET | `/users/{id}` | Perfil de usuario. | ✅ |
| PATCH | `/users/me/profile` | Editar perfil propio. | ✅ |

### A.2.3 Equipos (`/teams`)

| Método | Path | Resumen | Auth |
|---|---|---|---|
| GET | `/teams` | Equipos del usuario. | ✅ |
| POST | `/teams` | Crear equipo. | ✅ |
| GET | `/teams/{id}` | Detalle de equipo. | ✅ |
| GET | `/teams/{id}/members` | Miembros. | ✅ |
| POST | `/teams/{id}/members` | Invitar por email. | ✅ |
| POST | `/teams/{id}/join` | Unirse con token. | — |

### A.2.4 Notas (`/notes`)

| Método | Path | Resumen | Auth |
|---|---|---|---|
| GET | `/notes` | Lista notas (filtros: `team_id`, `q`, `tag`). | ✅ |
| POST | `/notes` | Crear nota. | ✅ |
| GET | `/notes/{id}` | Detalle de nota. | ✅ |
| PATCH | `/notes/{id}` | Actualizar nota. | ✅ |
| DELETE | `/notes/{id}` | Eliminar nota. | ✅ |
| GET | `/notes/{id}/links` | Enlaces de la nota. | ✅ |
| POST | `/notes/{id}/links` | Añadir enlace explícito. | ✅ |
| POST | `/notes/{id}/share` | Compartir nota al equipo. | ✅ |

### A.2.5 Metas (`/goals`)

| Método | Path | Resumen | Auth |
|---|---|---|---|
| GET | `/goals` | Lista metas. | ✅ |
| POST | `/goals` | Crear meta. | ✅ |
| GET | `/goals/{id}` | Detalle de meta. | ✅ |
| PATCH | `/goals/{id}` | Actualizar meta. | ✅ |
| DELETE | `/goals/{id}` | Eliminar meta. | ✅ |
| POST | `/goals/{id}/progress` | Sumar progreso. | ✅ |

### A.2.6 Tareas (`/tasks`)

| Método | Path | Resumen | Auth |
|---|---|---|---|
| GET | `/tasks` | Lista tareas (filtros: `goal_id`, `due_date`, `status`). | ✅ |
| POST | `/tasks` | Crear tarea. | ✅ |
| PATCH | `/tasks/{id}` | Actualizar tarea. | ✅ |
| DELETE | `/tasks/{id}` | Eliminar tarea. | ✅ |

### A.2.7 Grafo (`/graph`)

| Método | Path | Resumen | Auth |
|---|---|---|---|
| GET | `/graph` | Nodos y aristas (filtro: `team_id`). | ✅ |

### A.2.8 Notificaciones (`/notifications`)

| Método | Path | Resumen | Auth |
|---|---|---|---|
| GET | `/notifications` | Lista notificaciones. | ✅ |
| PATCH | `/notifications` | Marcar leídas (`{ ids?: string[] }`). | ✅ |

## A.3 Schemas principales

### A.3.1 `User`

```yaml
type: object
required: [id, email, name, role, created_at]
properties:
  id:         { type: string, format: uuid }
  email:      { type: string, format: email }
  name:       { type: string }
  handle:     { type: string, nullable: true }
  avatar_url: { type: string, format: uri, nullable: true }
  role:       { type: string, enum: [user, mentor, admin] }
  created_at: { type: string, format: date-time }
```

### A.3.2 `TeamMember`

```yaml
type: object
required: [id, user_id, team_id, role, joined_at]
properties:
  id:        { type: string, format: uuid }
  user_id:   { type: string, format: uuid }
  team_id:   { type: string, format: uuid }
  role:      { type: string, enum: [owner, mentor, member] }
  joined_at: { type: string, format: date-time }
```

### A.3.3 `Note`

```yaml
type: object
required: [id, title, content, author_id, tags, is_public, shared_with, created_at, updated_at]
properties:
  id:          { type: string, format: uuid }
  title:       { type: string, maxLength: 200 }
  content:     { type: string, maxLength: 100000 }
  author_id:   { type: string, format: uuid }
  team_id:     { type: string, format: uuid, nullable: true }
  tags:
    type: array
    items: { type: string, maxLength: 30 }
    maxItems: 10
  is_public:   { type: boolean }
  shared_with:
    type: array
    items: { type: string, format: uuid }
  created_at:  { type: string, format: date-time }
  updated_at:  { type: string, format: date-time }
```

### A.3.4 `Goal`

```yaml
type: object
required: [id, title, user_id, current, target, unit, created_at]
properties:
  id:          { type: string, format: uuid }
  title:       { type: string }
  description: { type: string, nullable: true }
  user_id:     { type: string, format: uuid }
  team_id:     { type: string, format: uuid, nullable: true }
  current:     { type: number, minimum: 0 }
  target:      { type: number, exclusiveMinimum: 0 }
  unit:        { type: string }
  deadline:    { type: string, format: date, nullable: true }
  created_at:  { type: string, format: date-time }
```

### A.3.5 `Task`

```yaml
type: object
required: [id, title, status, user_id, created_at]
properties:
  id:        { type: string, format: uuid }
  title:     { type: string }
  status:    { type: string, enum: [todo, in_progress, done] }
  user_id:   { type: string, format: uuid }
  goal_id:   { type: string, format: uuid, nullable: true }
  due_date:  { type: string, format: date, nullable: true }
  created_at:{ type: string, format: date-time }
```

### A.3.6 `AuthResponse`

```yaml
type: object
required: [user, tokens]
properties:
  user:
    $ref: '#/components/schemas/User'
  tokens:
    type: object
    required: [access_token, refresh_token, expires_in]
    properties:
      access_token:  { type: string }
      refresh_token: { type: string }
      expires_in:    { type: integer }
  requires_verification: { type: boolean }
```

## A.4 Códigos de error comunes

| HTTP | `code` | Significado |
|---|---|---|
| 400 | `validation_error` | Datos inválidos; ver `details`. |
| 401 | `unauthorized` | Token ausente o inválido. |
| 403 | `forbidden` | Sin permisos sobre el recurso. |
| 404 | `not_found` | Recurso inexistente. |
| 409 | `conflict` | Conflicto de unicidad. |
| 429 | `rate_limited` | Demasiadas requests. |
| 500 | `internal_error` | Error inesperado. |

## A.5 Versionado

- **Versión actual**: `0.1.0`.
- **Estabilidad**: contrato en preview; cambios breaking requieren
  bump a `1.0.0` y comunicación con提前 30 días.
- **Header opcional**: `API-Version: 2025-06-23`.