# FLOWSTATE Backend - AGENTS.md

## Project Overview

**FLOWSTATE** is a productivity app with Kanban + Timeboxing + AI commands. This is the Go backend API.

**Stack:**
- Go + Gin (monolith modular)
- sqlc (PostgreSQL code generation)
- Supabase Auth (JWT)
- Resend (email)
- OpenAI SDK (AI commands)

## Quick Start

```bash
# Install dependencies
go mod tidy

# Generate sqlc code
export PATH="$HOME/go/bin:$PATH" && sqlc generate

# Generate swagger docs
export PATH="$HOME/go/bin:$PATH" && swag init -g cmd/api/main.go -o docs

# Run server
go run cmd/api/main.go

# Run tests
go test ./...
```

## Project Structure

```
backend/
├── cmd/api/main.go           # Entry point, router setup
├── internal/
│   ├── config/               # Config loading (.env)
│   ├── db/                   # sqlc generated code
│   ├── handlers/             # HTTP handlers (auth, tasks, notes, timeblocks, ai)
│   ├── services/             # Business logic
│   ├── repositories/         # Database access (sqlc wrappers)
│   ├── middleware/           # Auth (JWT), CORS
│   └── email/                # Resend client + templates
├── pkg/models/               # Request/Response DTOs
├── queries/                  # SQL queries for sqlc
├── schema.sql                # Database schema
├── docs/                     # Swagger generated docs
├── static/                   # Static files (synthwave swagger theme)
└── .env.example              # Environment template
```

## Environment Variables

```env
# Server
PORT=8080
FRONTEND_URL=http://localhost:5173

# Database (Supabase pooler)
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-[REGION].pooler.supabase.com:5432/postgres

# Supabase (new API keys)
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Resend (email)
RESEND_API_KEY=re_...
EMAIL_FROM=FLOWSTATE <noreply@flowstate.app>

# OpenAI (AI commands)
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
```

## Key Patterns

### Adding a new entity

1. Add table to `schema.sql`
2. Create query in `queries/[entity].sql` with `-- name:` annotations
3. Run `sqlc generate` → auto-generates code in `internal/db/`
4. Create repository in `internal/repositories/[entity].go`
5. Create service in `internal/services/[entity].go`
6. Create handler in `internal/handlers/[entity].go`
7. Register routes in `cmd/api/main.go`
8. Add Swagger annotations to handler
9. Run `swag init` to regenerate docs

### Database (sqlc)

**Never edit `internal/db/`** - it's auto-generated.

To regenerate:
```bash
sqlc generate
```

Queries use PostgreSQL syntax with `-- name:` annotations.

### Service Boundaries

Services should follow dependency direction rules:
- Handlers → Services → Repositories → DB
- **No circular dependencies** between services
- If service A needs service B, B should be injected as dependency
- Dashboard/aggregations can call multiple services but should NOT orchestrate complex transactions

### AI Command Architecture

AI commands use simple text parsing (not NLP intent detection):
- Commands are prefixed with `/` (e.g., `/descomponer`, `/estimar`)
- The AI service receives command + input as plain text
- OpenAI interprets the intent from the command name
- Context is built from last 5 AI sessions stored in DB

**Available commands:**
- `/descomponer` - Break a task into smaller subtasks
- `/estimar` - Estimate time for a task
- `/planificar` - Create a daily plan

**Context compaction**: At 6+ sessions, the previous 5 are summarized into a compact context using GPT-4o-mini. This preserves semantic continuity while maintaining performance.

### Transaction Boundaries

For operations affecting multiple tables:
- Use database transactions in repository layer
- Keep transactions short (max 3-4 operations)
- For complex workflows (e.g., AI generating subtasks), handle idempotently

### Authentication Flow

1. `POST /api/v1/auth/signup` → creates user in local DB + sends confirmation email
2. `GET /api/v1/auth/confirm?token=xxx` → validates token, creates user in Supabase Auth via Admin API
3. `POST /api/v1/auth/login` → calls Supabase Auth, returns JWT

Protected routes use `middleware.AuthMiddleware` which validates JWT from Supabase.

**Security Note**: JWT validation includes full signature verification via Supabase JWKS. Never skip signature verification in production.

**Rollback Strategy**: If Supabase user creation fails after local DB insert, the confirmation endpoint returns an error and the local user record remains in "unconfirmed" state. A cleanup job should reconcile stale unconfirmed users older than 7 days.

### Supabase Admin API

The confirmation flow uses the Supabase Admin API to create users programmatically:

```bash
POST https://[REF].supabase.co/auth/admin/users
Authorization: Bearer SERVICE_ROLE_KEY
apikey: SERVICE_ROLE_KEY

{
  "email": "user@example.com",
  "password": "user-password",
  "email_confirm": true,
  "user_metadata": {"from_flowstate": "true"}
}
```

This requires `SUPABASE_SERVICE_ROLE_KEY` (never expose this key on frontend).

### Security: Ownership Checks

All protected endpoints verify resource ownership:

- **Tasks**: `GET`, `PUT`, `PATCH`, `DELETE` verify `task.user_id == authenticated_user_id`
- **Notes**: `GET`, `PUT` verify the parent task's `user_id`
- **TimeBlocks**: `PUT`, `DELETE` verify `timeblock.user_id == authenticated_user_id`
- **AISessions**: `GET` verifies `session.user_id == authenticated_user_id`

Returns `403 Forbidden` if ownership check fails.

### Adding tests

- Handlers: `internal/handlers/*_test.go`
- Services: `internal/services/*_test.go`
- Models: `pkg/models/*_test.go`
- Middleware: `internal/middleware/*_test.go`

```bash
go test ./... -v          # verbose
go test ./... -cover      # with coverage
go test ./... -run TestX  # specific test
```

## API Endpoints

All protected endpoints require `Authorization: Bearer <jwt>` header.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/signup` | Register new user | No |
| GET | `/api/v1/auth/confirm` | Confirm email | No |
| POST | `/api/v1/auth/login` | Login | No |
| GET | `/api/v1/auth/me` | Get current user profile | Yes |

### Tasks (Kanban)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/tasks` | List user tasks | Yes |
| POST | `/api/v1/tasks` | Create task | Yes |
| GET | `/api/v1/tasks/:id` | Get task | Yes |
| PUT | `/api/v1/tasks/:id` | Update task | Yes |
| PATCH | `/api/v1/tasks/:id/position` | Move task (drag & drop) | Yes |
| POST | `/api/v1/tasks/:id/complete` | Mark task as completed | Yes |
| DELETE | `/api/v1/tasks/:id` | Delete task | Yes |

### Notes (Task notes - singleton per task)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/tasks/:id/note` | Get task note | Yes |
| PUT | `/api/v1/tasks/:id/note` | Save/replace note | Yes |

### Time Blocks (Timeboxing)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/timeblocks` | List time blocks | Yes |
| GET | `/api/v1/timeblocks/today` | Today's time blocks | Yes |
| POST | `/api/v1/timeblocks` | Create time block | Yes |
| PUT | `/api/v1/timeblocks/:id` | Update time block | Yes |
| DELETE | `/api/v1/timeblocks/:id` | Delete time block | Yes |
| POST | `/api/v1/timeblocks/:id/start` | Mark as active | Yes |
| POST | `/api/v1/timeblocks/:id/complete` | Mark as completed | Yes |

### AI Commands

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/ai/command` | AI productivity assistant | Yes |
| GET | `/api/v1/ai/sessions` | List AI sessions | Yes |
| GET | `/api/v1/ai/sessions/:id` | Get AI session | Yes |

### Dashboard & Planning

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/dashboard` | Kanban board overview | Yes |
| GET | `/api/v1/today` | Daily productivity snapshot | Yes |
| GET | `/api/v1/focus` | Focus time metrics | Yes |

Swagger UI: `http://localhost:8080/docs` (synthwave theme) or `http://localhost:8080/swagger/index.html` (default)

## AI Context System

The AI command system maintains conversation context for personalized responses:

- **Context window**: Last 5 sessions are loaded for context
- **Auto-compaction**: At 6+ sessions, previous 5 are summarized into a compact context
- **Commands**: `/descomponer` (break into subtasks), `/estimar` (estimate time), `/planificar` (create daily plan)

### AI Response

When an AI command is executed, the response includes a `session_id` for tracking:

```json
{
  "command": "/descomponer",
  "result": "Created 3 subtasks...",
  "session_id": "uuid-of-session"
}
```

## Important Notes

- **API Versioning**: All endpoints are under `/api/v1/`
- **Supabase Auth**: Uses new publishable/secret keys format (not legacy JWT)
- **JWT validation**: Full signature verification via Supabase JWKS (cached locally)
- **Email templates**: HTML templates in `internal/email/templates/`
- **API docs**: Generated by swag, do not edit `docs/` manually
- **Ownership checks**: All task/note/timeblock mutations verify user ownership
- **AI context**: Auto-compacts at 6+ sessions to maintain performance
- **Notes**: Singleton per task (GET returns empty if none, PUT creates or replaces)
- **Dashboard endpoints**: Provide aggregated views (`/dashboard`, `/today`, `/focus`)
- **Rate limiting**: AI endpoints should implement rate limiting in production (placeholder for v2)

## Common Issues

**sqlc not found**: `export PATH="$HOME/go/bin:$PATH"`
**swag not found**: `export PATH="$HOME/go/bin:$PATH"`
**Build fails**: Run `go mod tidy` first
**Tests fail**: Check DATABASE_URL is set (some tests need DB)

## Database Schema (Kanban columns)

```
backlog → this_week → today → in_progress → done
```

Priority: `low`, `medium`, `high`

Time blocks: 30-minute increments for daily planning

## Scripts

```bash
# Full rebuild
go mod tidy && sqlc generate && swag init -g cmd/api/main.go -o docs && go build ./...

# Run with dev mode (logs to console)
go run cmd/api/main.go

# Update swagger
swag init -g cmd/api/main.go -o docs
```