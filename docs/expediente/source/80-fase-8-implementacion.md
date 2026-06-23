# FASE 8 — Implementación

<span class="chapter-marker">Fase 8 · Implementación</span>

## 8.1 Estructura del repositorio

FlowState se distribuye como **monorepo** con `apps/*` (despliegues
independientes) y `packages/*` (código compartido).

```
proyecto-alex/
├── apps/
│   ├── api/                 # Backend Go (Gin + sqlc + Swagger)
│   ├── web/                 # Next.js webapp
│   └── mobile/Flow-state/   # Expo app
├── docs/
│   └── expediente/          # ← este documento
│       ├── source/          # Markdown fuente
│       ├── diagrams/        # Mermaid
│       ├── theme/           # CSS Catppuccin
│       ├── build_pdf.py     # generador de PDF
│       └── build/           # artefactos
└── README.md
```

### 8.1.1 Reglas del monorepo

| Regla | Justificación |
|---|---|
| Cada `app/*` se despliega de forma independiente. | Aísla fallos y reduce tiempo de CI. |
| `docs/api.yaml` vive en `apps/web/docs/` y se referencia desde `apps/mobile/`. | Un solo contrato. |
| `openapi-typescript` se ejecuta en CI y falla el build si los tipos generados no commitean. | Evita drift. |
| Las migraciones viven en `apps/api/migrations/`. | Único origen del schema. |
| Cada `app/` tiene su propio `README.md` con cómo arrancar. | Onboarding rápido. |

### 8.1.2 Configuración de workspaces (Bun)

```jsonc
// apps/web/package.json (raíz de Bun workspaces)
{
  "name": "flowstate-web",
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0"
  }
}
```

```yaml
# apps/mobile/Flow-state/pnpm-workspace.yaml
packages:
  - .
```

### 8.1.3 Convenciones de Git

#### Branching

```
main                  ← producción, protegida
├── feat/RF-013-notas-create
├── fix/RF-019-wikilink-dedupe
├── chore/deps-go-1.22
└── docs/fase-4-requisitos
```

#### Commits

Conventional Commits obligatorio:

```bash
feat(notes): implementa creación de notas con wikilinks
fix(auth): corrige validación de refresh token expirado
docs(expediente): agrega matriz de trazabilidad
chore(deps): actualiza gin a 1.10.0
test(notes): añade tests de integración para /notes
```

#### Pull Requests

- Plantilla con secciones: *Contexto*, *Cambios*, *Pruebas*, *Riesgos*.
- Mínimo 1 review; 2 reviews si el cambio toca `auth/`, `db/`,
  migraciones o secretos.
- CI debe pasar: lint, type-check, tests, build.
- No se mergea con `// FIXME` o `console.log` en código de producción.

## 8.2 Convenciones Go

### 8.2.1 Estilo y formato

- **`gofmt`** + **`goimports`** ejecutados en CI.
- **`golangci-lint`** con reglas: `govet`, `staticcheck`, `errcheck`,
  `gosimple`, `ineffassign`, `unused`, `gocritic`, `revive`,
  `gocyclo` (max 15).
- Nombres en inglés; comentarios en español (documentación interna y
  godoc público).
- Línea máxima: 120 caracteres.

### 8.2.2 Paquetes

| Convención | Ejemplo |
|---|---|
| Nombres cortos, lowercase. | `auth`, `notes`, `team`. |
| Sin plurales. | `handler` no `handlers`. |
| Sin prefijos redundantes. | `auth.Service` no `auth.AuthService`. |
| Una responsabilidad por paquete. | `handler` sólo HTTP; `service` reglas. |

### 8.2.3 Manejo de errores

```go
// BIEN: envuelto con contexto y %w
if err := db.QueryRow(ctx, query, args...).Scan(&dest); err != nil {
    return fmt.Errorf("repository.notes.Create: scan: %w", err)
}

// MAL: error genérico sin contexto
return errors.New("error")

// MAL: log + return (log duplicado)
log.Println(err)
return err
```

```go
// Errores centinela
var (
    ErrNoteNotFound = errors.New("note not found")
)

// Errores tipados para 4xx
type ValidationError struct {
    Field   string
    Message string
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}
```

### 8.2.4 Context

- Toda función que haga I/O recibe `ctx context.Context` como primer
  parámetro.
- Nunca se almacena `ctx` en structs.

```go
func (r *noteRepo) Create(ctx context.Context, p CreateNoteParams) (Note, error) {
    row, err := r.q.InsertNote(ctx, db.InsertNoteParams{...})
    // ...
}
```

### 8.2.5 Inyección de dependencias

```go
// main.go (resumido)
func main() {
    cfg, err := config.Load()
    if err != nil { log.Fatal(err) }

    dbConn, err := pgxpool.New(ctx, cfg.DatabaseURL)
    if err != nil { log.Fatal(err) }
    defer dbConn.Close()

    queries := db.New(dbConn)

    noteRepo := repository.NewNoteRepository(queries)
    noteSvc  := service.NewNoteService(noteRepo)
    noteHnd  := handler.NewNoteHandler(noteSvc)

    r := gin.New()
    r.Use(middleware.RequestID(), middleware.Logger(), middleware.Recovery())

    api := r.Group("/api/v1")
    handler.RegisterAuthRoutes(api, authHnd)
    handler.RegisterNoteRoutes(api, noteHnd)
    // ...

    if err := r.Run(":" + cfg.Port); err != nil { log.Fatal(err) }
}
```

### 8.2.6 Testing

```go
// handler/notes_test.go
func TestCreateNote_Success(t *testing.T) {
    svc := &mockNoteService{
        CreateFn: func(ctx context.Context, n model.CreateNoteRequest, authorID string) (model.Note, error) {
            return model.Note{ID: "abc", Title: n.Title}, nil
        },
    }
    h := handler.NewNoteHandler(svc)

    body := `{"title":"hola","content":"x","tags":[]}`
    req := httptest.NewRequest(http.MethodPost, "/notes", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    req = req.WithContext(setUserID(req, "user-1"))

    w := httptest.NewRecorder()
    h.CreateNote(w, req)

    require.Equal(t, http.StatusCreated, w.Code)
    assert.Contains(t, w.Body.String(), `"id":"abc"`)
}
```

## 8.3 Estrategia de mocks

### 8.3.1 Mock-first en frontend

Antes de que exista backend, los clientes web y móvil se desarrollan
contra un mock en memoria (`src/lib/api/mock/`). Esto permite:

- Iterar la UI sin esperar al backend.
- Tener tests E2E estables.
- Definir el contrato OpenAPI de manera concreta.

El mock implementa la interfaz `ApiClient` exactamente igual que el
cliente real; sólo cambia el flag `NEXT_PUBLIC_USE_REAL_API`.

```ts
// lib/api/client/index.ts
export function createApiClient(): ApiClient {
  if (process.env.NEXT_PUBLIC_USE_REAL_API === 'true') {
    return new RealApiClient(env.API_BASE_URL)
  }
  return new MockApiClient(seedData)
}
```

### 8.3.2 En Go, fixtures para tests

```go
// internal/repository/note_repository_test.go
func TestNoteRepository_Create(t *testing.T) {
    pool := testutil.NewPool(t) // levanta contenedor Postgres efímero
    q := db.New(pool)
    repo := repository.NewNoteRepository(q)

    n, err := repo.Create(ctx, model.CreateNoteParams{
        Title:   "Test",
        Content: "Body",
        AuthorID: "user-1",
    })
    require.NoError(t, err)
    assert.NotEmpty(t, n.ID)
}
```

### 8.3.3 Coherencia web/móvil

El contrato `apps/web/docs/api.yaml` es la única fuente de verdad.
Cualquier cambio en el contrato:

1. PR en `apps/web/docs/`.
2. CI regenera tipos en web y mobile.
3. Si el cambio rompe un cliente, se ajusta el cliente en el mismo PR.

## 8.4 Integración IA (OpenRouter)

### 8.4.1 Por qué OpenRouter

- **Multi-modelo**: una sola API para GPT-4o-mini, Claude 3.5 Sonnet,
  Llama 3.1 70B, Gemini 1.5 Flash.
- **Coste**: pay-as-you-go, USD 0.005–0.06 por llamada según modelo.
- **Failover**: si un modelo falla, el siguiente se elige por política.

### 8.4.2 Endpoints internos

| Endpoint | Uso | Coste medio |
|---|---|---|
| `POST /api/v1/ai/summarize` | Resume notas > 800 palabras. | USD 0.003 |
| `POST /api/v1/ai/tags` | Sugiere 3–5 tags. | USD 0.001 |
| `POST /api/v1/ai/ask` | Responde preguntas sobre el grafo. | USD 0.01 |

### 8.4.3 Patrón Strategy

```go
// ai/provider/provider.go
type Provider interface {
    Complete(ctx context.Context, req CompletionRequest) (CompletionResponse, error)
}

type OpenRouterProvider struct {
    apiKey string
    client *http.Client
    model  string
}

// ai/provider/factory.go
func NewProvider(name string) Provider {
    switch name {
    case "openrouter":
        return &OpenRouterProvider{...}
    case "mock":
        return &mockProvider{}
    default:
        return &OpenRouterProvider{...}
    }
}
```

### 8.4.4 Rate limiting y circuit breaker

```go
type AIProvider struct {
    primary Provider
    breaker *gobreaker.CircuitBreaker
}

func (a *AIProvider) Complete(ctx context.Context, req CompletionRequest) (CompletionResponse, error) {
    resp, err := a.breaker.Execute(func() (any, error) {
        return a.primary.Complete(ctx, req)
    })
    if err != nil {
        // fallback a un modelo más barato o a un mensaje estático
        return fallbackResponse(req), nil
    }
    return resp.(CompletionResponse), nil
}
```

### 8.4.5 Observabilidad

- Cada llamada IA registra: `model`, `tokens_in`, `tokens_out`, `cost_usd`,
  `latency_ms`.
- Métrica agregada expuesta vía `/metrics` (Prometheus).
- Dashboard Grafana: coste mensual por usuario.