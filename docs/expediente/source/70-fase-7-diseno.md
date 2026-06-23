# FASE 7 — Diseño detallado

<span class="chapter-marker">Fase 7 · Diseño detallado</span>

## 7.1 Modelo de datos

### 7.1.1 Diagrama entidad-relación

```mermaid
%% id: 03-der
erDiagram
    USERS ||--o{ NOTES : "author_id"
    USERS ||--o{ GOALS : "user_id"
    USERS ||--o{ TASKS : "user_id"
    USERS ||--o{ NOTIFICATIONS : "user_id"
    USERS ||--o{ TEAM_MEMBERS : "user_id"
    TEAMS ||--o{ TEAM_MEMBERS : "team_id"
    TEAMS ||--o{ NOTES : "team_id"
    TEAMS ||--o{ GOALS : "team_id"
    GOALS ||--o{ TASKS : "goal_id"
    NOTES ||--o{ NOTE_LINKS : "source_note_id"
    NOTES ||--o{ NOTE_LINKS : "target_note_id"

    USERS {
        TEXT id PK
        TEXT email UK
        TEXT name
        TEXT handle UK
        TEXT avatar_url
        TEXT role
        TEXT password_hash
        INT verified
        TEXT created_at
    }
    TEAMS {
        TEXT id PK
        TEXT name
        TEXT slug UK
        TEXT description
        TEXT owner_id FK
        TEXT created_at
    }
    TEAM_MEMBERS {
        TEXT id PK
        TEXT user_id FK
        TEXT team_id FK
        TEXT role
        TEXT joined_at
    }
    NOTES {
        TEXT id PK
        TEXT title
        TEXT content
        TEXT author_id FK
        TEXT team_id FK
        TEXT tags "JSON array"
        INT is_public
        TEXT shared_with "JSON array"
        TEXT created_at
        TEXT updated_at
    }
    NOTE_LINKS {
        TEXT id PK
        TEXT source_note_id FK
        TEXT target_note_id FK "nullable"
        TEXT target_title
    }
    GOALS {
        TEXT id PK
        TEXT title
        TEXT description
        TEXT user_id FK
        TEXT team_id FK
        REAL current
        REAL target
        TEXT unit
        TEXT deadline
        TEXT created_at
    }
    TASKS {
        TEXT id PK
        TEXT title
        TEXT status
        TEXT user_id FK
        TEXT goal_id FK
        TEXT due_date
        TEXT created_at
    }
    NOTIFICATIONS {
        TEXT id PK
        TEXT user_id FK
        TEXT type
        TEXT title
        TEXT body
        INT read
        TEXT created_at
    }
```

### 7.1.2 Reglas de integridad

| Tabla | Constraint | Justificación |
|---|---|---|
| `users` | `UNIQUE(email)` | Una cuenta por email. |
| `users` | `password_hash` nullable | Permite solo-Google. |
| `teams` | `UNIQUE(slug)` | URLs amigables. |
| `team_members` | `UNIQUE(user_id, team_id)` | Una membresía por par. |
| `notes` | `tags TEXT NOT NULL DEFAULT '[]'` | Array JSON para simplicidad MVP. |
| `note_links` | `UNIQUE(source_note_id, target_title)` | Wikilink colapsado (ADR-6). |
| `goals` | `current <= target` (check) | Sentido del progreso. |
| `tasks` | `status IN ('todo','in_progress','done')` (check) | Estados discretos. |

### 7.1.3 Índices

```sql
-- Búsqueda full-text de notas
CREATE INDEX notes_title_trgm_idx ON notes USING gin (title gin_trgm_ops);
CREATE INDEX notes_content_trgm_idx ON notes USING gin (content gin_trgm_ops);

-- Filtros comunes
CREATE INDEX notes_team_id_idx ON notes (team_id);
CREATE INDEX notes_author_id_idx ON notes (author_id);
CREATE INDEX notes_updated_at_idx ON notes (updated_at DESC);

-- Tareas y metas
CREATE INDEX tasks_user_id_idx ON tasks (user_id);
CREATE INDEX tasks_goal_id_idx ON tasks (goal_id);
CREATE INDEX tasks_due_date_idx ON tasks (due_date);

-- Notificaciones
CREATE INDEX notifications_user_id_unread_idx
  ON notifications (user_id, read, created_at DESC);

-- Wikilinks: target_title es la clave de búsqueda
CREATE INDEX note_links_target_title_idx ON note_links (target_title);
CREATE INDEX note_links_target_note_id_idx ON note_links (target_note_id);
```

### 7.1.4 Tipos personalizados y enums

Postgres permite modelar los enums como `TEXT` con `CHECK` (más
flexible) o como `CREATE TYPE` (más estricto). FlowState usa
`TEXT + CHECK` en MVP para evitar migraciones que añadan valores al
enum:

```sql
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'mentor', 'admin'));

ALTER TABLE team_members ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('owner', 'mentor', 'member'));

ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'done'));

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('invitation', 'mention', 'task', 'reminder'));
```

### 7.1.5 Estrategia de migración

- **Herramienta**: `golang-migrate` con archivos `NNNNNN_name.up.sql` y
  `NNNNNN_name.down.sql`.
- **Regla**: cada cambio de schema es un commit con su up/down.
- **PR review**: cambios de schema requieren revisión explícita de un
  segundo integrante.
- **Datos**: las migraciones nunca incluyen datos seed; los seeds van en
  `apps/api/seed/` y se ejecutan sólo en `dev`/`staging`.

## 7.2 Diseño de APIs

### 7.2.1 Convenciones REST

| Aspecto | Convención |
|---|---|
| Prefijo | `/api/v1` (versión en URL). |
| Recursos | sustantivos en plural: `/notes`, `/teams`. |
| Verbos | sólo `GET`, `POST`, `PATCH`, `DELETE`. |
| IDs | UUID v4 (`gen_random_uuid()`). |
| Fechas | ISO 8601 con zona UTC: `2025-06-23T10:30:00Z`. |
| Paginación | `?limit=20&cursor=...` (cursor, no offset). |
| Errores | JSON: `{ "error": { "code", "message", "details" } }`. |
| Autenticación | `Authorization: Bearer <access_token>`. |
| Content-Type | `application/json; charset=utf-8`. |
| Versionado | header `API-Version` opcional; default a `2025-06-23`. |

### 7.2.2 Ejemplo de endpoint: `POST /api/v1/notes`

#### Request

```http
POST /api/v1/notes HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "title": "Apuntes de cálculo",
  "content": "# Derivadas\n\nLa [[Regla de la cadena]]...",
  "tags": ["calculo", "semestre-1"],
  "team_id": null
}
```

#### Response `201 Created`

```json
{
  "id": "7c0f2a8e-9b3a-4c7e-bf88-1234567890ab",
  "title": "Apuntes de cálculo",
  "content": "# Derivadas\n\nLa [[Regla de la cadena]]...",
  "author_id": "a4e1d2c3-...-...",
  "team_id": null,
  "tags": ["calculo", "semestre-1"],
  "is_public": false,
  "shared_with": [],
  "created_at": "2025-06-23T10:30:00Z",
  "updated_at": "2025-06-23T10:30:00Z",
  "links": [
    { "target_title": "Regla de la cadena", "target_note_id": null }
  ]
}
```

#### Errores

```json
// 400 Bad Request — validación
{ "error": { "code": "validation_error", "message": "title is required" } }

// 401 Unauthorized
{ "error": { "code": "unauthorized", "message": "invalid or expired token" } }

// 403 Forbidden — no eres miembro del team
{ "error": { "code": "forbidden", "message": "not a member of team" } }
```

### 7.2.3 DTOs clave (Go)

```go
// internal/model/note.go
package model

type Note struct {
    ID         string    `json:"id"`
    Title      string    `json:"title"`
    Content    string    `json:"content"`
    AuthorID   string    `json:"author_id"`
    TeamID     *string   `json:"team_id,omitempty"`
    Tags       []string  `json:"tags"`
    IsPublic   bool      `json:"is_public"`
    SharedWith []string  `json:"shared_with"`
    CreatedAt  time.Time `json:"created_at"`
    UpdatedAt  time.Time `json:"updated_at"`
}

type CreateNoteRequest struct {
    Title   string   `json:"title" validate:"required,min=1,max=200"`
    Content string   `json:"content" validate:"max=100000"`
    Tags    []string `json:"tags" validate:"max=10,dive,max=30"`
    TeamID  *string  `json:"team_id,omitempty" validate:"omitempty,uuid"`
}

type UpdateNoteRequest struct {
    Title      *string  `json:"title,omitempty" validate:"omitempty,min=1,max=200"`
    Content    *string  `json:"content,omitempty" validate:"omitempty,max=100000"`
    Tags       []string `json:"tags,omitempty" validate:"omitempty,max=10"`
    IsPublic   *bool    `json:"is_public,omitempty"`
    SharedWith []string `json:"shared_with,omitempty"`
}

type NoteFilter struct {
    TeamID *string
    Tag    *string
    Query  *string
    Limit  int
    Cursor *string
}
```

### 7.2.4 Respuestas de error estandarizadas

```go
// internal/model/error.go
type APIError struct {
    Code    string         `json:"code"`
    Message string         `json:"message"`
    Details map[string]any `json:"details,omitempty"`
}

type ErrorResponse struct {
    Error APIError `json:"error"`
}

var (
    ErrValidation   = errors.New("validation_error")
    ErrUnauthorized = errors.New("unauthorized")
    ErrForbidden    = errors.New("forbidden")
    ErrNotFound     = errors.New("not_found")
    ErrConflict     = errors.New("conflict")
    ErrInternal     = errors.New("internal_error")
)
```

## 7.3 Wikilinks y grafo de conocimiento

### 7.3.1 Algoritmo de extracción

```go
// service/note_links.go
var wikiLinkRegex = regexp.MustCompile(`\[\[([^\[\]]+?)\]\]`)

func ExtractWikiLinks(content string) []string {
    matches := wikiLinkRegex.FindAllStringSubmatch(content, -1)
    seen := map[string]bool{}
    out := []string{}
    for _, m := range matches {
        title := strings.TrimSpace(m[1])
        if title == "" || seen[title] {
            continue
        }
        seen[title] = true
        out = append(out, title)
    }
    return out
}
```

### 7.3.2 Resolución de wikilinks

Al guardar una nota:

1. Se extraen los `[[target_title]]` del contenido.
2. Para cada `target_title`:
   - Si existe una nota con ese título y el `author_id` (o es del mismo
     `team_id`), se inserta `note_links(target_note_id = id)`.
   - Si no existe, se inserta `note_links(target_note_id = NULL,
     target_title = ...)`. Cuando se cree la nota destino, una tarea
     programada resuelve el enlace.
3. Se aplica `ON CONFLICT (source_note_id, target_title) DO NOTHING`
   (cumple ADR-6).

### 7.3.3 Endpoint de grafo

`GET /api/v1/graph?team_id=...` devuelve:

```json
{
  "nodes": [
    { "id": "note-1", "title": "Apuntes de cálculo", "team_id": null }
  ],
  "edges": [
    { "source": "note-1", "target": "note-7", "type": "wikilink" }
  ]
}
```

El frontend lo renderiza con `d3-force`.

## 7.4 Seguridad y autenticación

### 7.4.1 Flujo de tokens

```mermaid
%% id: 05-secuencia-auth
sequenceDiagram
    participant U as Usuario
    participant C as Cliente
    participant A as API
    participant DB as Postgres

    U->>C: Email + password
    C->>A: POST /auth/login
    A->>DB: SELECT user WHERE email
    DB-->>A: user + password_hash
    A->>A: bcrypt.Compare
    alt OK
        A->>A: generate access (15m) + refresh (7d)
        A->>DB: INSERT refresh_tokens (hash, exp)
        A-->>C: 200 { user, tokens }
        C->>C: store tokens (secure storage)
    else fail
        A-->>C: 401 invalid credentials
    end
    Note over C,A: Tras 15 minutos el access expira
    C->>A: GET /auth/me (access expired)
    A-->>C: 401 token expired
    C->>A: POST /auth/refresh { refresh_token }
    A->>DB: SELECT refresh_tokens WHERE hash
    A->>A: validate exp + revoke old
    A->>DB: INSERT new refresh_tokens
    A-->>C: 200 { access, refresh }
```

### 7.4.2 Hashing de contraseñas

- Algoritmo: **bcrypt** cost 12.
- El campo `password_hash` en DB es `TEXT`.
- Para el MVP no se añade pepper externo; queda en roadmap (RNF-006).

### 7.4.3 Rate limiting

```go
// middleware/ratelimit.go
import "golang.org/x/time/rate"

var perUser = rate.NewLimiter(rate.Every(time.Second), 60)
// 60 req/s por usuario en promedio, picos hasta 60.
```

- 60 req/s por usuario autenticado.
- 10 req/s por IP no autenticada (evita enumeration).
- 429 con `Retry-After`.

### 7.4.4 CORS

```go
config := cors.Config{
    AllowOrigins:     []string{"https://app.flowstate.app", "http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
    ExposeHeaders:    []string{"X-Request-ID"},
    AllowCredentials: true,
    MaxAge:           12 * time.Hour,
}
```

### 7.4.5 Headers de seguridad

```go
// middleware/security_headers.go
c.Header("X-Content-Type-Options", "nosniff")
c.Header("X-Frame-Options", "DENY")
c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
c.Header("Permissions-Policy", "geolocation=(), microphone=()")
// Strict-Transport-Security se aplica en el reverse proxy
```

### 7.4.6 Logging estructurado

```go
// platform/logger.go
logger := zap.NewProduction()
logger.Info("request",
    zap.String("method", c.Request.Method),
    zap.String("path", c.Request.URL.Path),
    zap.Int("status", c.Writer.Status()),
    zap.Duration("latency", time.Since(start)),
    zap.String("request_id", reqID),
    zap.String("user_id", userID), // opcional
)
```

> **Regla**: nunca loggear PII (email completo, password, tokens).
> Emails se hashean con SHA-256 truncado para correlación.